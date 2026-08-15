import { createHash } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Parser from 'rss-parser';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { AiCoreService } from '../ai-core/ai-core.service';
import { NotificationDispatchService, DispatchChannel } from '../notifications/dispatch.service';

const MAX_ITEMS_PER_SOURCE = 50;
// ponytail: hard cap on synchronous per-citizen sends; move to a queue if real volumes exceed this
const MAX_DISPATCH_CITIZENS = 500;

interface ExtractedJob {
  organization: string | null;
  qualification: string | null;
  minAge: number | null;
  maxAge: number | null;
  lastDate: string | null;
  district: string | null;
  summary: string | null;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly parser = new Parser({ timeout: 15000 });
  private running = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ai: AiCoreService,
    private dispatcher: NotificationDispatchService,
  ) {}

  // ---------- config ----------

  async isCronEnabled(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'jobs_enabled' } });
    const val = row?.value ?? this.config.get('JOBS_ENABLED', 'true');
    return val.toLowerCase() !== 'false';
  }

  // ---------- sources CRUD + test ----------

  listSources() {
    return this.prisma.jobSource.findMany({ orderBy: { name: 'asc' } });
  }

  createSource(body: { name: string; url: string; type?: string; active?: boolean }) {
    return this.prisma.jobSource.create({
      data: {
        name: body.name,
        url: body.url,
        type: body.type ?? 'rss',
        active: body.active ?? true,
      },
    });
  }

  async updateSource(id: string, body: { name?: string; url?: string; type?: string; active?: boolean }) {
    const existing = await this.prisma.jobSource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Job source not found');
    return this.prisma.jobSource.update({ where: { id }, data: body });
  }

  async deleteSource(id: string) {
    const existing = await this.prisma.jobSource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Job source not found');
    await this.prisma.jobSource.delete({ where: { id } });
    return { ok: true };
  }

  async testSource(url: string): Promise<{ ok: boolean; itemCount: number; sampleTitles: string[]; error?: string }> {
    try {
      const feed = await this.parser.parseURL(url);
      const items = feed.items ?? [];
      return { ok: true, itemCount: items.length, sampleTitles: items.slice(0, 5).map((i) => i.title ?? '') };
    } catch (err) {
      return { ok: false, itemCount: 0, sampleTitles: [], error: err instanceof Error ? err.message : String(err) };
    }
  }

  // ---------- ingestion ----------

  private hashContent(url: string | undefined, title: string, sourceId: string): string {
    const key = url ? url.trim().toLowerCase() : `${sourceId}:${title.trim().toLowerCase()}`;
    return createHash('sha256').update(key).digest('hex');
  }

  async runCycle(force = false): Promise<{
    status: string;
    sourcesChecked: number;
    postingsFetched: number;
    postingsNew: number;
    expired: number;
    errors: { source: string; error: string }[];
  }> {
    if (this.running) {
      return { status: 'already_running', sourcesChecked: 0, postingsFetched: 0, postingsNew: 0, expired: 0, errors: [] };
    }
    if (!force && !(await this.isCronEnabled())) {
      return { status: 'disabled', sourcesChecked: 0, postingsFetched: 0, postingsNew: 0, expired: 0, errors: [] };
    }

    this.running = true;
    try {
      const sources = await this.prisma.jobSource.findMany({ where: { active: true } });
      let postingsFetched = 0;
      let postingsNew = 0;
      const errors: { source: string; error: string }[] = [];

      for (const source of sources) {
        try {
          const feed = await this.parser.parseURL(source.url);
          const items = (feed.items ?? []).slice(0, MAX_ITEMS_PER_SOURCE);
          postingsFetched += items.length;

          await this.prisma.jobSource.update({
            where: { id: source.id },
            data: { lastFetchAt: new Date(), lastError: null },
          });

          for (const entry of items) {
            const title = (entry.title ?? '').trim();
            if (!title) continue;
            const link = entry.link ?? entry.guid;
            const contentHash = this.hashContent(link, title, source.id);

            const existing = await this.prisma.jobPosting.findUnique({
              where: { contentHash },
              select: { id: true },
            });
            if (existing) continue;

            const snippet = entry.contentSnippet ?? entry.summary ?? undefined;
            await this.createPosting(source.id, title, link, snippet, contentHash);
            postingsNew += 1;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Job feed fetch failed for ${source.name}: ${message}`);
          errors.push({ source: source.name, error: message });
          await this.prisma.jobSource.update({ where: { id: source.id }, data: { lastError: message } });
        }
      }

      const expired = await this.prisma.jobPosting.updateMany({
        where: { lastDate: { lt: new Date() }, status: { in: ['New', 'Reviewed'] } },
        data: { status: 'Expired' },
      });

      this.logger.log(
        `Jobs cycle done: ${sources.length} sources, ${postingsNew} new postings, ${expired.count} expired`,
      );
      return {
        status: errors.length > 0 && postingsNew === 0 ? 'failed' : errors.length > 0 ? 'partial' : 'completed',
        sourcesChecked: sources.length,
        postingsFetched,
        postingsNew,
        expired: expired.count,
        errors,
      };
    } finally {
      this.running = false;
    }
  }

  private async createPosting(
    sourceId: string,
    title: string,
    url: string | undefined,
    snippet: string | undefined,
    contentHash: string,
  ) {
    const extracted = await this.ai.completeJson<ExtractedJob>({
      system:
        'You extract structured data from Indian government job notifications. ' +
        'Return a JSON object with keys: organization (string|null), qualification (string|null, e.g. "10th pass", "Degree", "ITI"), ' +
        'minAge (number|null), maxAge (number|null), lastDate (ISO 8601 date string|null, the application deadline), ' +
        'district (string|null), summary (string|null, one short sentence). Use null when a field is not present.',
      user: `Title: ${title}\nDescription: ${snippet ?? ''}\nURL: ${url ?? ''}`,
      maxTokens: 400,
    });

    let lastDate: Date | undefined;
    if (extracted?.lastDate) {
      const d = new Date(extracted.lastDate);
      if (!Number.isNaN(d.getTime())) lastDate = d;
    }

    await this.prisma.jobPosting.create({
      data: {
        sourceId,
        title,
        url,
        contentHash,
        organization: extracted?.organization ?? null,
        qualification: extracted?.qualification ?? null,
        minAge: extracted?.minAge ?? null,
        maxAge: extracted?.maxAge ?? null,
        lastDate,
        district: extracted?.district ?? null,
        summary: extracted?.summary ?? snippet ?? null,
        aiExtracted: extracted !== null,
      },
    });
  }

  // ---------- postings ----------

  async listPostings(query: PaginationDto & { status?: string }) {
    const { page, limit, search, status } = query;
    const where: Record<string, unknown> = {};
    if (status && ['New', 'Reviewed', 'Dispatched', 'Expired'].includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        include: { source: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jobPosting.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getPosting(id: string) {
    const posting = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        source: { select: { id: true, name: true, url: true } },
        dispatchLogs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!posting) throw new NotFoundException('Job posting not found');
    return posting;
  }

  async updatePostingStatus(id: string, status: string) {
    if (!['New', 'Reviewed', 'Dispatched', 'Expired'].includes(status)) {
      return this.getPosting(id);
    }
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Job posting not found');
    return this.prisma.jobPosting.update({ where: { id }, data: { status } });
  }

  // ---------- matching ----------

  private matchWhere(posting: { qualification: string | null; minAge: number | null; maxAge: number | null; district: string | null }): Prisma.CitizenWhereInput {
    const and: Prisma.CitizenWhereInput[] = [{ status: 'Active' }];

    if (posting.qualification) {
      // ponytail: naive keyword OR-match on occupation; upgrade to a real education field when Citizen grows one
      const keywords = posting.qualification
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 2);
      if (keywords.length) {
        and.push({ OR: keywords.map((k) => ({ occupation: { contains: k, mode: 'insensitive' as const } })) });
      }
    }
    if (posting.minAge != null) and.push({ age: { gte: posting.minAge } });
    if (posting.maxAge != null) and.push({ age: { lte: posting.maxAge } });

    return { AND: and };
  }

  async matches(id: string) {
    const posting = await this.getPosting(id);
    const where = this.matchWhere(posting);
    const [count, preview] = await Promise.all([
      this.prisma.citizen.count({ where }),
      this.prisma.citizen.findMany({
        where,
        select: {
          id: true,
          name: true,
          age: true,
          occupation: true,
          mobile: true,
          village: { select: { name: true } },
          mandal: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    const withMobile = await this.prisma.citizen.count({ where: { AND: [where, { mobile: { not: null } }] } });
    return { count, withMobile, preview };
  }

  // ---------- dispatch ----------

  async dispatchToCitizens(id: string, channels: string[], dispatchedBy: string) {
    const posting = await this.getPosting(id);
    const valid = (channels ?? []).filter((c): c is DispatchChannel => c === 'sms' || c === 'whatsapp');

    const citizens = await this.prisma.citizen.findMany({
      where: { AND: [this.matchWhere(posting), { mobile: { not: null } }] },
      select: { id: true, name: true, mobile: true },
      take: MAX_DISPATCH_CITIZENS,
    });

    const body = [
      posting.organization,
      posting.qualification ? `Qualification: ${posting.qualification}` : null,
      posting.lastDate ? `Last date: ${new Date(posting.lastDate).toLocaleDateString('en-IN')}` : null,
      posting.url,
    ]
      .filter(Boolean)
      .join('\n');

    let sent = 0;
    // ponytail: dispatch() always writes one in-app row (scoped to the dispatcher via userId);
    // acceptable noise — split the adapter calls out of dispatch() if it ever matters
    for (const citizen of citizens) {
      try {
        await this.dispatcher.dispatch({
          userId: dispatchedBy,
          type: 'Info',
          title: `Govt Job: ${posting.title}`,
          body,
          channels: valid,
          smsTo: citizen.mobile ?? undefined,
          whatsappTo: citizen.mobile ?? undefined,
        });
        sent += 1;
      } catch (err) {
        this.logger.warn(`Job dispatch failed for citizen ${citizen.id}: ${err instanceof Error ? err.message : err}`);
      }
    }

    const log = await this.prisma.jobDispatchLog.create({
      data: {
        postingId: posting.id,
        citizenCount: sent,
        channels: valid,
        dispatchedBy,
      },
    });

    await this.prisma.jobPosting.update({ where: { id: posting.id }, data: { status: 'Dispatched' } });
    this.logger.log(`Dispatched job ${posting.id} to ${sent} citizens via [${valid.join(', ')}]`);
    return { ok: true, citizenCount: sent, channels: valid, logId: log.id };
  }
}
