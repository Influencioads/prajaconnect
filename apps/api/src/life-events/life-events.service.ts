import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import { TranslationService } from '../ai-core/translation.service';

export interface LifeEventOccurrence {
  date: Date;
  occasion: 'birthday' | 'anniversary';
  targetType: string;
  targetId: string;
  targetName: string;
  mobile: string | null;
}

export interface LifeEventDeadline {
  date: Date;
  occasion: 'deadline';
  targetType: 'Scheme' | 'PermissionRequest';
  targetId: string;
  targetName: string;
  message: string;
}

interface SourceConfig {
  targetType: string;
  delegate: string;
  nameField: string;
  dobField: string;
  activeOnly: boolean;
}

/** Models scanned for birthdays / anniversaries. Citizen keeps its legacy `dob` column. */
const SOURCES: SourceConfig[] = [
  { targetType: 'Citizen', delegate: 'citizen', nameField: 'name', dobField: 'dob', activeOnly: true },
  { targetType: 'VipContact', delegate: 'vipContact', nameField: 'name', dobField: 'dateOfBirth', activeOnly: false },
  { targetType: 'Cadre', delegate: 'cadre', nameField: 'name', dobField: 'dateOfBirth', activeOnly: true },
  { targetType: 'CommitteeMember', delegate: 'committeeMember', nameField: 'fullName', dobField: 'dateOfBirth', activeOnly: true },
  { targetType: 'ImpLeader', delegate: 'impLeader', nameField: 'fullName', dobField: 'dateOfBirth', activeOnly: true },
  { targetType: 'Influencer', delegate: 'influencer', nameField: 'fullName', dobField: 'dateOfBirth', activeOnly: true },
  { targetType: 'PressContact', delegate: 'pressContact', nameField: 'fullName', dobField: 'dateOfBirth', activeOnly: true },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  birthday:
    'Dear {name}, wishing you a very happy birthday! May the year ahead bring you good health, happiness and success.',
  anniversary:
    'Dear {name}, heartfelt wishes on your wedding anniversary! Wishing you many more years of togetherness.',
  condolence:
    'Dear {name}, we are deeply saddened by the loss in your family. Our thoughts and prayers are with you and your loved ones.',
  festival: 'Dear {name}, warm wishes to you and your family on this festive occasion!',
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function render(body: string, name: string): string {
  return body.split('{name}').join(name);
}

@Injectable()
export class LifeEventsService {
  private readonly logger = new Logger(LifeEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly dispatch: NotificationDispatchService,
    private readonly translation: TranslationService,
  ) {}

  // ---- config ----
  async isCronEnabled(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'life_events_cron_enabled' } });
    const val = row?.value ?? this.config.get('LIFE_EVENTS_CRON_ENABLED', 'true') ?? 'true';
    return val.toLowerCase() !== 'false';
  }

  // ---- scanning ----
  /** Next occurrence of the month/day of `d` on or after `from` (start of day). */
  private nextOccurrence(d: Date, from: Date): Date {
    const next = new Date(from.getFullYear(), d.getMonth(), d.getDate());
    if (next < from) next.setFullYear(next.getFullYear() + 1);
    return next;
  }

  async scanOccasions(from: Date, days: number): Promise<LifeEventOccurrence[]> {
    const until = addDays(from, days);
    const events: LifeEventOccurrence[] = [];
    for (const src of SOURCES) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delegate = (this.prisma as any)[src.delegate];
      const where: Record<string, unknown> = {
        OR: [{ [src.dobField]: { not: null } }, { anniversaryDate: { not: null } }],
      };
      if (src.activeOnly) where.status = 'Active';
      // ponytail: full scan + JS month/day filter; move to raw EXTRACT(month, day) SQL if these tables grow past ~100k rows
      const rows = await delegate.findMany({
        where,
        select: {
          id: true,
          mobile: true,
          [src.nameField]: true,
          [src.dobField]: true,
          anniversaryDate: true,
        },
      });
      for (const row of rows) {
        const pairs: Array<[Date | null, 'birthday' | 'anniversary']> = [
          [row[src.dobField], 'birthday'],
          [row.anniversaryDate, 'anniversary'],
        ];
        for (const [value, occasion] of pairs) {
          if (!value) continue;
          const next = this.nextOccurrence(new Date(value), from);
          if (next >= from && next < until) {
            events.push({
              date: next,
              occasion,
              targetType: src.targetType,
              targetId: row.id,
              targetName: row[src.nameField],
              mobile: row.mobile ?? null,
            });
          }
        }
      }
    }
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private detailsDate(details: Prisma.JsonValue | null): Date | null {
    if (!details || typeof details !== 'object' || Array.isArray(details)) return null;
    const obj = details as Record<string, unknown>;
    for (const key of ['expiryDate', 'validUntil', 'expiresAt', 'eventDate', 'date']) {
      const raw = obj[key];
      if (typeof raw !== 'string' && typeof raw !== 'number') continue;
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  }

  async scanDeadlines(from: Date, days: number): Promise<LifeEventDeadline[]> {
    const until = addDays(from, days);
    const out: LifeEventDeadline[] = [];
    const schemes = await this.prisma.scheme.findMany({
      where: { status: 'Active', endDate: { gte: from, lt: until } },
      select: { id: true, name: true, endDate: true },
    });
    for (const s of schemes) {
      out.push({
        date: s.endDate as Date,
        occasion: 'deadline',
        targetType: 'Scheme',
        targetId: s.id,
        targetName: s.name,
        message: `Scheme "${s.name}" enrollment deadline is on ${(s.endDate as Date).toDateString()}.`,
      });
    }
    const permissions = await this.prisma.permissionRequest.findMany({
      where: { status: { in: ['Pending', 'Approved'] } },
      select: { id: true, title: true, details: true },
    });
    for (const p of permissions) {
      const expiry = this.detailsDate(p.details);
      if (expiry && expiry >= from && expiry < until) {
        out.push({
          date: expiry,
          occasion: 'deadline',
          targetType: 'PermissionRequest',
          targetId: p.id,
          targetName: p.title,
          message: `Permission request "${p.title}" expires on ${expiry.toDateString()}.`,
        });
      }
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // ---- templates + rendering ----
  private async templateBodies(occasion: string): Promise<{ en: string; te: string | null }> {
    const [en, te] = await Promise.all([
      this.prisma.greetingTemplate.findFirst({ where: { occasion, language: 'en', active: true } }),
      this.prisma.greetingTemplate.findFirst({ where: { occasion, language: 'te', active: true } }),
    ]);
    const enBody = en?.body ?? DEFAULT_TEMPLATES[occasion] ?? 'Dear {name}, best wishes!';
    let teBody = te?.body ?? null;
    if (!teBody) {
      // Translate the template once (placeholder preserved); null when AI is unconfigured.
      const t = await this.translation.translate({ text: enBody, to: 'te', from: 'en' });
      teBody = t.translated ? t.text : null;
    }
    return { en: enBody, te: teBody };
  }

  // ---- daily run ----
  async runDaily() {
    const today = startOfDay(new Date());
    const occasions = await this.scanOccasions(today, 1);
    const deadlines = await this.scanDeadlines(today, 7);

    const bodies: Record<string, { en: string; te: string | null }> = {};
    for (const occasion of new Set(occasions.map((e) => e.occasion))) {
      bodies[occasion] = await this.templateBodies(occasion);
    }

    const data: Prisma.GreetingQueueItemCreateManyInput[] = [
      ...occasions.map((e) => ({
        date: today,
        occasion: e.occasion,
        targetType: e.targetType,
        targetId: e.targetId,
        targetName: e.targetName,
        mobile: e.mobile,
        message: render(bodies[e.occasion].en, e.targetName),
        messageTe: bodies[e.occasion].te ? render(bodies[e.occasion].te as string, e.targetName) : null,
      })),
      ...deadlines.map((d) => ({
        date: today,
        occasion: d.occasion,
        targetType: d.targetType,
        targetId: d.targetId,
        targetName: d.targetName,
        mobile: null,
        message: d.message,
      })),
    ];

    const result = data.length
      ? await this.prisma.greetingQueueItem.createMany({ data, skipDuplicates: true })
      : { count: 0 };
    this.logger.log(
      `Life events scan: ${occasions.length} occasion(s), ${deadlines.length} deadline(s), ${result.count} enqueued`,
    );
    return { scanned: occasions.length + deadlines.length, enqueued: result.count };
  }

  // ---- queries ----
  async today() {
    const today = startOfDay(new Date());
    const items = await this.prisma.greetingQueueItem.findMany({
      where: { date: { gte: today, lt: addDays(today, 1) } },
      orderBy: [{ occasion: 'asc' }, { targetName: 'asc' }],
    });
    const counts = { pending: 0, approved: 0, sent: 0, skipped: 0 };
    for (const i of items) {
      if (i.status === 'Pending') counts.pending++;
      else if (i.status === 'Approved') counts.approved++;
      else if (i.status === 'Sent') counts.sent++;
      else if (i.status === 'Skipped') counts.skipped++;
    }
    return { date: today, items, counts };
  }

  async upcoming(days: number) {
    const from = startOfDay(new Date());
    const capped = Math.min(Math.max(days, 1), 31);
    const [events, deadlines] = await Promise.all([
      this.scanOccasions(from, capped),
      this.scanDeadlines(from, capped),
    ]);
    return { from, days: capped, events, deadlines };
  }

  async listQueue(query: PaginationDto, status?: string, occasion?: string) {
    const where: Prisma.GreetingQueueItemWhereInput = {};
    if (status) where.status = status;
    if (occasion) where.occasion = occasion;
    const [data, total] = await Promise.all([
      this.prisma.greetingQueueItem.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.greetingQueueItem.count({ where }),
    ]);
    return { data, meta: paginate(query.page, query.limit, total) };
  }

  async setQueueStatus(id: string, status: 'Approved' | 'Skipped') {
    const item = await this.prisma.greetingQueueItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Queue item not found');
    return this.prisma.greetingQueueItem.update({ where: { id }, data: { status } });
  }

  // ---- sending ----
  async sendQueueItem(id: string, userId?: string) {
    const item = await this.prisma.greetingQueueItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Queue item not found');
    if (!item.mobile) {
      return this.prisma.greetingQueueItem.update({
        where: { id },
        data: { status: 'Skipped', sentVia: { skipped: 'no mobile number' } },
      });
    }
    const body = item.messageTe ? `${item.message}\n${item.messageTe}` : item.message;
    const result = await this.dispatch.dispatch({
      userId,
      title: `${item.occasion.charAt(0).toUpperCase()}${item.occasion.slice(1)} greeting — ${item.targetName}`,
      body,
      type: 'Info',
      channels: ['whatsapp', 'sms'],
      whatsappTo: item.mobile,
      smsTo: item.mobile,
    });
    return this.prisma.greetingQueueItem.update({
      where: { id },
      data: { status: 'Sent', sentVia: result as Prisma.InputJsonValue },
    });
  }

  async bulkSend(ids: string[] | undefined, userId?: string) {
    let targets = ids?.filter(Boolean);
    if (!targets?.length) {
      const today = startOfDay(new Date());
      const rows = await this.prisma.greetingQueueItem.findMany({
        where: { date: { gte: today, lt: addDays(today, 1) }, status: { in: ['Pending', 'Approved'] } },
        select: { id: true },
      });
      targets = rows.map((r) => r.id);
    }
    let sent = 0;
    let skipped = 0;
    for (const id of targets) {
      const res = await this.sendQueueItem(id, userId);
      if (res.status === 'Sent') sent++;
      else skipped++;
    }
    return { requested: targets.length, sent, skipped };
  }

  // ---- greeting templates CRUD ----
  async listTemplates(occasion?: string) {
    return this.prisma.greetingTemplate.findMany({
      where: occasion ? { occasion } : undefined,
      orderBy: [{ occasion: 'asc' }, { language: 'asc' }],
    });
  }

  async createTemplate(dto: { occasion: string; language?: string; body: string; active?: boolean }) {
    return this.prisma.greetingTemplate.create({
      data: {
        occasion: dto.occasion,
        language: dto.language ?? 'en',
        body: dto.body,
        active: dto.active ?? true,
      },
    });
  }

  async updateTemplate(id: string, dto: { occasion?: string; language?: string; body?: string; active?: boolean }) {
    const found = await this.prisma.greetingTemplate.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Template not found');
    return this.prisma.greetingTemplate.update({ where: { id }, data: dto });
  }

  async deleteTemplate(id: string) {
    const found = await this.prisma.greetingTemplate.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Template not found');
    await this.prisma.greetingTemplate.delete({ where: { id } });
    return { success: true };
  }

  // ---- condolence log CRUD ----
  async listCondolences(query: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.condolenceLog.findMany({
        include: { citizen: { select: { id: true, name: true, mobile: true } } },
        orderBy: { date: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.condolenceLog.count(),
    ]);
    return { data, meta: paginate(query.page, query.limit, total) };
  }

  async createCondolence(
    dto: { citizenId?: string; name: string; date?: string; notes?: string; mobile?: string },
    userId?: string,
  ) {
    const log = await this.prisma.condolenceLog.create({
      data: {
        citizenId: dto.citizenId ?? null,
        name: dto.name,
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes ?? null,
        createdBy: userId ?? null,
      },
      include: { citizen: { select: { id: true, name: true, mobile: true } } },
    });
    // Queue a condolence message for review alongside today's greetings.
    const bodies = await this.templateBodies('condolence');
    await this.prisma.greetingQueueItem.createMany({
      data: [
        {
          date: startOfDay(new Date()),
          occasion: 'condolence',
          targetType: dto.citizenId ? 'Citizen' : 'Manual',
          targetId: dto.citizenId ?? log.id,
          targetName: log.name,
          mobile: log.citizen?.mobile ?? dto.mobile ?? null,
          message: render(bodies.en, log.name),
          messageTe: bodies.te ? render(bodies.te, log.name) : null,
        },
      ],
      skipDuplicates: true,
    });
    return log;
  }

  async updateCondolence(id: string, dto: { name?: string; date?: string; notes?: string; citizenId?: string | null }) {
    const found = await this.prisma.condolenceLog.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Condolence log not found');
    return this.prisma.condolenceLog.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.citizenId !== undefined ? { citizenId: dto.citizenId } : {}),
      },
      include: { citizen: { select: { id: true, name: true, mobile: true } } },
    });
  }

  async deleteCondolence(id: string) {
    const found = await this.prisma.condolenceLog.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Condolence log not found');
    await this.prisma.condolenceLog.delete({ where: { id } });
    return { success: true };
  }
}
