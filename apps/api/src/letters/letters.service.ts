import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { AiCoreService } from '../ai-core/ai-core.service';
import { TranslationService } from '../ai-core/translation.service';
import { PdfService, PdfSection } from '../pdf/pdf.service';
import { BrandingService } from '../branding/branding.service';
import { NotificationDispatchService, DispatchChannel } from '../notifications/dispatch.service';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '../uploads/upload.config';
import {
  CreateLetterDto,
  DraftLetterDto,
  LetterQueryDto,
  SendLetterDto,
  UpdateLetterDto,
} from './dto/letter.dto';

const TYPE_LABELS: Record<string, string> = {
  department: 'Departmental Request',
  condolence: 'Condolence Letter',
  congratulation: 'Congratulatory Letter',
  recommendation: 'Letter of Recommendation',
  other: 'Official Letter',
};

const TEMPLATE_CLOSINGS: Record<string, string> = {
  department:
    'I request you to kindly look into the above and take necessary action at the earliest. Your attention to this matter would be highly appreciated.',
  condolence:
    'Please accept my heartfelt condolences on behalf of myself and my office. Our thoughts are with you and your family in this difficult time.',
  congratulation:
    'Please accept my warmest congratulations on this achievement. I wish you continued success in all your future endeavours.',
  recommendation:
    'I recommend the above without reservation and request you to kindly extend all possible consideration and support.',
  other:
    'I request you to kindly consider the above and extend your cooperation in this matter.',
};

const listInclude = {
  department: { select: { id: true, name: true } },
  official: { select: { id: true, name: true, designation: true } },
  citizen: { select: { id: true, name: true } },
  grievance: { select: { id: true, code: true, title: true, status: true } },
  createdBy: { select: { id: true, name: true, designation: true } },
} satisfies Prisma.LetterInclude;

@Injectable()
export class LettersService {
  private readonly logger = new Logger(LettersService.name);

  constructor(
    private prisma: PrismaService,
    private aiCore: AiCoreService,
    private translation: TranslationService,
    private pdf: PdfService,
    private branding: BrandingService,
    private dispatch: NotificationDispatchService,
  ) {}

  async list(query: LetterQueryDto) {
    const { page, limit, search, type, status, language } = query;
    const where: Prisma.LetterWhereInput = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (language) where.language = language;
    if (search) {
      where.OR = [
        { refNo: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { addresseeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.letter.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.letter.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const grouped = await this.prisma.letter.groupBy({ by: ['status'], _count: { _all: true } });
    const byStatus: Record<string, number> = {};
    for (const g of grouped) byStatus[g.status] = g._count._all;
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return { total, byStatus };
  }

  async options() {
    const [departments, officials] = await Promise.all([
      this.prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.governmentOfficial.findMany({
        select: { id: true, name: true, designation: true, departmentId: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { departments, officials };
  }

  async get(id: string) {
    const letter = await this.prisma.letter.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        official: { select: { id: true, name: true, designation: true, office: true } },
        citizen: { select: { id: true, name: true, mobile: true } },
        grievance: { select: { id: true, code: true, title: true, status: true } },
        createdBy: { select: { id: true, name: true, designation: true } },
      },
    });
    if (!letter) throw new NotFoundException('Letter not found');
    return letter;
  }

  async create(dto: CreateLetterDto, user: AuthenticatedUser) {
    const refNo = await this.nextRefNo();
    return this.prisma.letter.create({
      data: {
        ...dto,
        refNo,
        language: dto.language ?? 'en',
        status: 'Draft',
        createdById: user.id,
      },
      include: listInclude,
    });
  }

  async update(id: string, dto: UpdateLetterDto) {
    const letter = await this.get(id);
    // Editing a finalized letter invalidates its PDF — drop back to Draft.
    const data: Prisma.LetterUncheckedUpdateInput = { ...dto };
    if (letter.status !== 'Draft') {
      data.status = 'Draft';
      data.pdfUrl = null;
    }
    return this.prisma.letter.update({ where: { id }, data, include: listInclude });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.letter.delete({ where: { id } });
    return { deleted: true };
  }

  async draft(dto: DraftLetterDto) {
    const [grievance, citizen, official, department] = await Promise.all([
      dto.grievanceId
        ? this.prisma.grievance.findUnique({
            where: { id: dto.grievanceId },
            include: {
              department: { select: { name: true } },
              citizen: { select: { name: true } },
              mandal: { select: { name: true } },
            },
          })
        : null,
      dto.citizenId
        ? this.prisma.citizen.findUnique({
            where: { id: dto.citizenId },
            include: {
              village: { select: { name: true } },
              mandal: { select: { name: true } },
            },
          })
        : null,
      dto.officialId
        ? this.prisma.governmentOfficial.findUnique({
            where: { id: dto.officialId },
            include: { department: { select: { name: true } } },
          })
        : null,
      dto.departmentId
        ? this.prisma.department.findUnique({ where: { id: dto.departmentId } })
        : null,
    ]);

    const context: string[] = [];
    if (grievance) {
      context.push(
        `Linked grievance ${grievance.code} — "${grievance.title}" (status: ${grievance.status}` +
          `${grievance.department ? `, department: ${grievance.department.name}` : ''}` +
          `${grievance.mandal ? `, mandal: ${grievance.mandal.name}` : ''}` +
          `${grievance.citizen ? `, reported by ${grievance.citizen.name}` : ''}): ${grievance.description}`,
      );
    }
    if (citizen) {
      context.push(
        `Concerned citizen: ${citizen.name}` +
          `${citizen.occupation ? `, ${citizen.occupation}` : ''}` +
          `${citizen.village ? `, ${citizen.village.name} village` : ''}` +
          `${citizen.mandal ? `, ${citizen.mandal.name} mandal` : ''}.`,
      );
    }
    if (official) {
      context.push(
        `Addressee official: ${official.name}, ${official.designation}` +
          `${official.department ? `, ${official.department.name}` : ''}.`,
      );
    }
    if (department && !official?.department) {
      context.push(`Addressed department: ${department.name}.`);
    }

    const label = TYPE_LABELS[dto.type] ?? 'Official Letter';
    const ai = await this.aiCore.completeJson<{ subject: string; body: string }>({
      system:
        'You draft formal official letters for an Indian political leader\'s constituency office. ' +
        'Return JSON {"subject": string, "body": string}. The body is the letter text only — start with a salutation ' +
        '(e.g. "Respected Sir/Madam,") and end before the signature block; do not include the addressee block, date, or "Yours faithfully". ' +
        'Formal, courteous, specific, grounded strictly in the facts provided; 150-250 words.',
      user: [
        `Letter type: ${label}`,
        `Addressee: ${dto.addresseeName}${dto.addresseeDesignation ? `, ${dto.addresseeDesignation}` : ''}`,
        ...context,
        'Key points to cover:',
        ...dto.points.map((p) => `- ${p}`),
      ].join('\n'),
    });

    let subject: string;
    let body: string;
    let aiGenerated = false;
    if (ai?.subject && ai?.body) {
      subject = ai.subject;
      body = ai.body;
      aiGenerated = true;
    } else {
      this.logger.log('AI unavailable; falling back to template letter');
      subject = `${label} — ${dto.points[0].slice(0, 80)}`;
      body = [
        'Respected Sir/Madam,',
        '',
        `I am writing to you regarding the following matter${dto.points.length > 1 ? 's' : ''}:`,
        '',
        ...dto.points.map((p) => `• ${p}`),
        ...(context.length ? ['', ...context] : []),
        '',
        TEMPLATE_CLOSINGS[dto.type] ?? TEMPLATE_CLOSINGS.other,
      ].join('\n');
    }

    let bodyTe: string | null = null;
    if ((dto.language ?? 'en') === 'te') {
      const t = await this.translation.translate({ text: body, to: 'te', from: 'en' });
      if (t.translated) bodyTe = t.text;
      else this.logger.log('Translation unavailable; letter kept in English only');
    }

    return { subject, body, bodyTe, aiGenerated };
  }

  async finalize(id: string) {
    const letter = await this.get(id);
    const branding = await this.branding.getBranding();
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });

    const addresseeBlock = [
      'To,',
      letter.addresseeName,
      ...(letter.addresseeDesignation ? [letter.addresseeDesignation] : []),
      ...(letter.department ? [letter.department.name] : []),
      ...(letter.official?.office ? [letter.official.office] : []),
    ];
    const signatureBlock = [
      'Yours faithfully,',
      '',
      letter.createdBy?.name ?? '',
      ...(letter.createdBy?.designation ? [letter.createdBy.designation] : []),
      branding.partyFullName || branding.party || branding.appName,
    ].filter((line, i) => line !== '' || i === 1);

    const sections: PdfSection[] = [
      { paragraphs: [`Ref No: ${letter.refNo}`, `Date: ${dateStr}`] },
      { paragraphs: addresseeBlock },
      { paragraphs: [`Subject: ${letter.subject}`] },
      { paragraphs: letter.body.split(/\n+/).map((l) => l.trim()).filter(Boolean) },
      ...(letter.bodyTe
        ? [
            {
              heading: 'Telugu translation',
              paragraphs: letter.bodyTe.split(/\n+/).map((l) => l.trim()).filter(Boolean),
            },
          ]
        : []),
      { paragraphs: signatureBlock },
    ];

    const doc = await this.pdf.brandedDoc({
      title: TYPE_LABELS[letter.type] ?? 'Official Letter',
      sections,
    });
    const buffer = await this.pdf.render(doc);

    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
    const filename = `letter-${letter.refNo}-${randomBytes(4).toString('hex')}.pdf`;
    writeFileSync(join(UPLOAD_DIR, filename), buffer);

    return this.prisma.letter.update({
      where: { id },
      data: { pdfUrl: `${UPLOAD_URL_PREFIX}/${filename}`, status: 'Final' },
      include: listInclude,
    });
  }

  async pdfStream(id: string) {
    const letter = await this.prisma.letter.findUnique({
      where: { id },
      select: { pdfUrl: true, refNo: true },
    });
    if (!letter) throw new NotFoundException('Letter not found');
    if (!letter.pdfUrl) throw new BadRequestException('Letter is not finalized yet');
    const filename = letter.pdfUrl.split('/').pop() as string;
    const path = join(UPLOAD_DIR, filename);
    if (!existsSync(path)) throw new NotFoundException('PDF file missing; finalize the letter again');
    return { stream: createReadStream(path), refNo: letter.refNo };
  }

  async send(id: string, dto: SendLetterDto, user: AuthenticatedUser) {
    const letter = await this.get(id);
    if (!letter.pdfUrl) throw new BadRequestException('Finalize the letter before sending');
    if (dto.channels.includes('email') && !dto.emailTo) {
      throw new BadRequestException('emailTo is required for the email channel');
    }
    if (dto.channels.includes('whatsapp') && !dto.whatsappTo) {
      throw new BadRequestException('whatsappTo is required for the whatsapp channel');
    }

    const filename = letter.pdfUrl.split('/').pop() as string;
    // ponytail: local file path works for SMTP attachments; WhatsApp documents need a
    // publicly reachable URL (put the API behind a public host to enable) — sends are
    // simulated + logged when channels are unconfigured.
    const results = await this.dispatch.dispatch({
      userId: user.id,
      title: `Letter ${letter.refNo}: ${letter.subject}`,
      body: letter.body,
      type: 'Info',
      channels: dto.channels as DispatchChannel[],
      emailTo: dto.emailTo,
      whatsappTo: dto.whatsappTo,
      attachmentUrl: join(UPLOAD_DIR, filename),
    });

    const updated = await this.prisma.letter.update({
      where: { id },
      data: { status: 'Issued' },
      include: listInclude,
    });
    return { letter: updated, results };
  }

  /** Reference number like LTR-2026-0001, sequential per calendar year. */
  private async nextRefNo() {
    const prefix = `LTR-${new Date().getFullYear()}-`;
    const rows = await this.prisma.letter.findMany({
      where: { refNo: { startsWith: prefix } },
      select: { refNo: true },
    });
    let max = 0;
    for (const { refNo } of rows) {
      const num = parseInt(refNo.slice(prefix.length), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }
}
