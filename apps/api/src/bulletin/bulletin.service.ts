import { existsSync } from 'fs';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@praja/database';
import { NotificationType, UserRole } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import { WhatsappAdapter } from '../notifications/channels/whatsapp.adapter';
import { EmailAdapter } from '../notifications/channels/email.adapter';
import { BulletinAggregationService, BulletinSection } from './bulletin-aggregation.service';
import { BulletinNarrativeService } from './bulletin-narrative.service';
import { BulletinPdfService } from './bulletin-pdf.service';

const EDITIONS = ['daily', 'weekly', 'monthly'] as const;
export type BulletinEdition = (typeof EDITIONS)[number];

const LEADER_ROLES: UserRole[] = [
  UserRole.SuperAdmin,
  UserRole.StateLeader,
  UserRole.DistrictLeader,
  UserRole.ConstituencyIncharge,
];

interface SubscriptionChannels {
  push?: boolean;
  whatsapp?: boolean;
  email?: boolean;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

@Injectable()
export class BulletinService {
  private readonly logger = new Logger(BulletinService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private aggregation: BulletinAggregationService,
    private narrative: BulletinNarrativeService,
    private pdf: BulletinPdfService,
    private dispatch: NotificationDispatchService,
    private whatsapp: WhatsappAdapter,
    private email: EmailAdapter,
  ) {}

  private async setting(key: string, envFallback = ''): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row?.value) return row.value;
    return envFallback;
  }

  async isEnabled(): Promise<boolean> {
    const val = await this.setting('bulletin_enabled', this.config.get('BULLETIN_ENABLED', 'true'));
    return val.toLowerCase() !== 'false';
  }

  async setEnabled(enabled: boolean) {
    await this.prisma.setting.upsert({
      where: { key: 'bulletin_enabled' },
      update: { value: String(enabled) },
      create: { key: 'bulletin_enabled', value: String(enabled), category: 'bulletin' },
    });
    return { enabled };
  }

  async getConfig() {
    return { enabled: await this.isEnabled() };
  }

  // ---------- generation ----------

  /**
   * Generate (or regenerate) the bulletin for a date+edition.
   * With skipIfExists the call is idempotent (used by the cron).
   */
  async run(dateInput?: string, edition: string = 'daily', opts: { skipIfExists?: boolean } = {}) {
    if (!EDITIONS.includes(edition as BulletinEdition)) {
      throw new BadRequestException(`edition must be one of ${EDITIONS.join(', ')}`);
    }
    const date = startOfDay(dateInput ? new Date(dateInput) : new Date());
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    const existing = await this.prisma.dailyBulletin.findUnique({
      where: { date_edition: { date, edition } },
    });
    if (existing && opts.skipIfExists) {
      this.logger.log(`Bulletin ${edition} ${date.toISOString().slice(0, 10)} already exists; skipping`);
      return existing;
    }

    const sections = await this.aggregation.buildSections(date, edition);
    const story = await this.narrative.compose(sections, date, edition);
    const rendered = await this.pdf.renderAndStore({ date, edition, narrative: story.narrative, sections });

    const data = {
      narrative: story.narrative,
      narrativeTe: story.narrativeTe,
      sections: sections as unknown as Prisma.InputJsonValue,
      pdfUrl: rendered.pdfUrl,
      status: 'Ready',
    };
    const bulletin = existing
      ? await this.prisma.dailyBulletin.update({ where: { id: existing.id }, data })
      : await this.prisma.dailyBulletin.create({ data: { date, edition, ...data } });

    // Deliver only on first generation — manual regenerates should not re-spam.
    if (!existing) {
      const deliveryResult = await this.deliver(bulletin.id, date, edition, story.narrative, rendered);
      return this.prisma.dailyBulletin.update({
        where: { id: bulletin.id },
        data: { deliveryResult: deliveryResult as Prisma.InputJsonValue, status: 'Delivered' },
      });
    }
    return bulletin;
  }

  // ---------- delivery ----------

  private async deliver(
    bulletinId: string,
    date: Date,
    edition: string,
    narrative: string | null,
    rendered: { pdfUrl: string; filePath: string },
  ) {
    const [leaders, subs] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { name: { in: LEADER_ROLES } }, status: 'Active' },
        select: { id: true },
        take: 100,
      }),
      this.prisma.bulletinSubscription.findMany({
        where: { active: true },
        include: { user: { select: { id: true, mobile: true, email: true, status: true } } },
      }),
    ]);

    const userIds = [...new Set([...leaders.map((u) => u.id), ...subs.map((s) => s.userId)])];
    const editionLabel = edition.charAt(0).toUpperCase() + edition.slice(1);
    const title = `${editionLabel} Constituency Bulletin — ${date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
    const body = narrative ? narrative.split('\n')[0].slice(0, 300) : 'Your constituency bulletin is ready.';
    const link = `bulletin/${bulletinId}`;

    const results: Record<string, unknown> = {};
    if (userIds.length) {
      results.inappPush = await this.dispatch.dispatch({
        userIds,
        type: NotificationType.Info,
        title,
        body,
        link,
        channels: ['push'],
        data: { link },
      });
    } else {
      results.inappPush = { skipped: 'no recipients' };
    }

    // WhatsApp document needs a publicly reachable URL; email can attach the local file.
    const baseUrl = (await this.setting('public_base_url', this.config.get('PUBLIC_BASE_URL', ''))).replace(/\/$/, '');
    const publicPdfUrl = baseUrl ? `${baseUrl}${rendered.pdfUrl}` : null;

    const whatsappResults: Record<string, unknown>[] = [];
    const emailResults: Record<string, unknown>[] = [];
    for (const sub of subs) {
      if (sub.user.status !== 'Active') continue;
      const channels = (sub.channels ?? {}) as SubscriptionChannels;
      if (channels.whatsapp && sub.user.mobile) {
        const result = publicPdfUrl
          ? await this.whatsapp.sendDocument(sub.user.mobile, publicPdfUrl, title)
          : await this.whatsapp.sendText(sub.user.mobile, `${title}\n${body}`);
        whatsappResults.push({ userId: sub.userId, ...result });
      }
      if (channels.email && sub.user.email) {
        const attachment = existsSync(rendered.filePath) ? rendered.filePath : undefined;
        const result = await this.email.send(sub.user.email, title, narrative ?? body, attachment);
        emailResults.push({ userId: sub.userId, ...result });
      }
    }
    if (whatsappResults.length) results.whatsapp = whatsappResults;
    if (emailResults.length) results.email = emailResults;

    this.logger.log(
      `Bulletin ${bulletinId} delivered: ${userIds.length} in-app/push, ${whatsappResults.length} whatsapp, ${emailResults.length} email`,
    );
    return results;
  }

  // ---------- reads ----------

  /** List bulletins for a month (YYYY-MM), optionally by edition. */
  async list(month?: string, edition?: string) {
    let where: Prisma.DailyBulletinWhereInput = {};
    if (month) {
      const start = new Date(`${month}-01T00:00:00`);
      if (isNaN(start.getTime())) throw new BadRequestException('month must be YYYY-MM');
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      where = { date: { gte: start, lt: end } };
    }
    if (edition) where.edition = edition;

    const data = await this.prisma.dailyBulletin.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        id: true,
        date: true,
        edition: true,
        status: true,
        pdfUrl: true,
        narrative: true,
        createdAt: true,
      },
    });
    return { data };
  }

  async get(id: string) {
    const bulletin = await this.prisma.dailyBulletin.findUnique({ where: { id } });
    if (!bulletin) throw new NotFoundException('Bulletin not found');
    return bulletin;
  }

  /** PDF buffer + filename for streaming; regenerates the file if it was cleaned up. */
  async getPdfFile(id: string): Promise<{ filePath: string; filename: string }> {
    const bulletin = await this.get(id);
    let pdfUrl = bulletin.pdfUrl;
    if (!pdfUrl || !existsSync(this.pdf.filePathFor(pdfUrl))) {
      const rendered = await this.pdf.renderAndStore({
        date: bulletin.date,
        edition: bulletin.edition,
        narrative: bulletin.narrative,
        sections: bulletin.sections as unknown as BulletinSection[],
      });
      pdfUrl = rendered.pdfUrl;
      await this.prisma.dailyBulletin.update({ where: { id }, data: { pdfUrl } });
    }
    return {
      filePath: this.pdf.filePathFor(pdfUrl),
      filename: pdfUrl.split('/').pop() ?? 'bulletin.pdf',
    };
  }

  // ---------- subscriptions ----------

  async getSubscription(userId: string) {
    const sub = await this.prisma.bulletinSubscription.findUnique({ where: { userId } });
    return (
      sub ?? {
        userId,
        scope: 'full',
        mandalId: null,
        channels: { push: true },
        sendAtHour: 5,
        active: false,
      }
    );
  }

  async putSubscription(
    userId: string,
    body: {
      scope?: string;
      mandalId?: string | null;
      channels?: SubscriptionChannels;
      sendAtHour?: number;
      active?: boolean;
    },
  ) {
    if (body.scope && !['full', 'mandal'].includes(body.scope)) {
      throw new BadRequestException('scope must be full or mandal');
    }
    const data = {
      scope: body.scope ?? 'full',
      mandalId: body.scope === 'mandal' ? body.mandalId ?? null : null,
      channels: (body.channels ?? { push: true }) as Prisma.InputJsonValue,
      sendAtHour: body.sendAtHour ?? 5,
      active: body.active ?? true,
    };
    return this.prisma.bulletinSubscription.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}
