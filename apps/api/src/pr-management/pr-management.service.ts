import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrIngestionRunStatus, PrAlertStatus, PrAlertType, PrAlertSeverity } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { PrConfigService } from './pr-config.service';
import { PrIngestionService } from './pr-ingestion.service';
import { PrAnalysisService } from './pr-analysis.service';
import { PrReportService } from './pr-report.service';
import { PrAlertService } from './pr-alert.service';

@Injectable()
export class PrManagementService {
  private readonly logger = new Logger(PrManagementService.name);
  private running = false;

  constructor(
    private prisma: PrismaService,
    private config: PrConfigService,
    private ingestion: PrIngestionService,
    private analysis: PrAnalysisService,
    private reports: PrReportService,
    private alerts: PrAlertService,
  ) {}

  async runCycle(force = false): Promise<{ runId: string; status: string }> {
    if (this.running) {
      return { runId: '', status: 'already_running' };
    }

    if (!force && !(await this.config.isCronEnabled())) {
      return { runId: '', status: 'disabled' };
    }

    this.running = true;
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 4 * 60 * 60 * 1000);

    const run = await this.prisma.prIngestionRun.create({
      data: { status: PrIngestionRunStatus.Running },
    });

    try {
      const ingest = await this.ingestion.ingestAll(run.id);

      const newArticleIds = ingest.newArticleIds;
      const analyzed = await this.analysis.analyzeNewArticles(newArticleIds);

      if (analyzed.length > 0) {
        await this.reports.createPeriodReport(periodStart, periodEnd, analyzed);
      } else {
        const recentProcessed = await this.prisma.newsArticle.findMany({
          where: { processedAt: { gte: periodStart } },
          select: { id: true, title: true, sentiment: true, importanceScore: true, aiSeverity: true, summary: true, coverageRecommendation: true },
        });
        if (recentProcessed.length > 0) {
          await this.reports.createPeriodReport(
            periodStart,
            periodEnd,
            recentProcessed.map((a) => ({
              articleId: a.id,
              sentiment: a.sentiment ?? 'Neutral',
              importanceScore: a.importanceScore ?? 40,
              severity: a.aiSeverity ?? 'Low',
              mentionsLeader: false,
              leaderNamesMentioned: [],
              summary: a.summary ?? a.title,
              coverageRecommendation: a.coverageRecommendation ?? '',
              suggestedResponseOutline: '',
              isOppositionAttack: (a.sentiment ?? '').toLowerCase().includes('negative'),
            })),
          );
        }
      }

      await this.alerts.scanTimelineViolations();
      await this.alerts.checkReputationDrop();

      const status =
        ingest.errors.length > 0 && ingest.articlesNew === 0
          ? PrIngestionRunStatus.Failed
          : ingest.errors.length > 0
            ? PrIngestionRunStatus.Partial
            : PrIngestionRunStatus.Completed;

      await this.prisma.prIngestionRun.update({
        where: { id: run.id },
        data: {
          status,
          sourcesChecked: ingest.sourcesChecked,
          articlesFetched: ingest.articlesFetched,
          articlesNew: ingest.articlesNew,
          errors: ingest.errors.length ? ingest.errors : undefined,
          finishedAt: new Date(),
        },
      });

      return { runId: run.id, status };
    } catch (err) {
      this.logger.error('PR cycle failed', err as Error);
      await this.prisma.prIngestionRun.update({
        where: { id: run.id },
        data: {
          status: PrIngestionRunStatus.Failed,
          errors: [{ error: err instanceof Error ? err.message : String(err) }],
          finishedAt: new Date(),
        },
      });
      throw err;
    } finally {
      this.running = false;
    }
  }

  async dashboard() {
    const [
      openAlerts,
      criticalAlerts,
      slaBreaches,
      latestReport,
      lastRun,
      openAlertsList,
    ] = await Promise.all([
      this.prisma.prAlert.count({ where: { status: PrAlertStatus.Open } }),
      this.alerts.countOpenCritical(),
      this.alerts.countSlaBreaches(),
      this.reports.getLatest(),
      this.prisma.prIngestionRun.findFirst({ orderBy: { startedAt: 'desc' } }),
      this.prisma.prAlert.findMany({
        where: { status: PrAlertStatus.Open },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        include: {
          linkedArticle: { select: { id: true, title: true, url: true } },
          linkedAttack: { select: { id: true, title: true } },
        },
      }),
    ]);

    const cronEnabled = await this.config.isCronEnabled();

    return {
      openAlerts,
      criticalAlerts,
      slaBreaches,
      cronEnabled,
      latestReport,
      lastRun,
      openAlertsList,
      nextScheduledRun: this.nextCronRun(),
    };
  }

  private nextCronRun(): string {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    const hour = now.getHours();
    const nextBlock = Math.ceil((hour + 1) / 4) * 4;
    if (nextBlock >= 24) {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    } else {
      next.setHours(nextBlock, 0, 0, 0);
    }
    return next.toISOString();
  }

  async listReports(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.prReport.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.prReport.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getReport(id: string) {
    const report = await this.prisma.prReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async listAlerts(query: PaginationDto & { type?: string; severity?: string; status?: string }) {
    const { page, limit, type, severity, status } = query;
    const where: Record<string, unknown> = {};
    if (type && Object.values(PrAlertType).includes(type as PrAlertType)) {
      where.type = type;
    }
    if (severity && Object.values(PrAlertSeverity).includes(severity as PrAlertSeverity)) {
      where.severity = severity;
    }
    if (status && Object.values(PrAlertStatus).includes(status as PrAlertStatus)) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.prAlert.findMany({
        where,
        orderBy: [{ status: 'asc' }, { severity: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          linkedArticle: { select: { id: true, title: true, url: true } },
          linkedAttack: { select: { id: true, title: true } },
          acknowledgedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.prAlert.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listSources() {
    return this.prisma.newsSource.findMany({ orderBy: { name: 'asc' } });
  }

  async createSource(body: { name: string; url: string; language?: string; enabled?: boolean }) {
    return this.prisma.newsSource.create({
      data: {
        name: body.name,
        url: body.url,
        language: body.language ?? 'te',
        enabled: body.enabled ?? true,
      },
    });
  }

  async updateSource(
    id: string,
    body: { name?: string; url?: string; language?: string; enabled?: boolean },
  ) {
    const existing = await this.prisma.newsSource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('News source not found');
    return this.prisma.newsSource.update({ where: { id }, data: body });
  }

  async deleteSource(id: string) {
    const existing = await this.prisma.newsSource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('News source not found');
    await this.prisma.newsSource.delete({ where: { id } });
    return { ok: true };
  }

  async testSource(url: string) {
    return this.ingestion.testSource(url);
  }

  async listRuns(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.prIngestionRun.findMany({
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.prIngestionRun.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getLatestBriefing() {
    const report = await this.reports.getLatest();
    if (!report) {
      return {
        available: false,
        summary: 'No PR reports generated yet. The 4-hour news cycle will create the first report.',
      };
    }
    return {
      available: true,
      reportId: report.id,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      summary: report.summary,
      mustCover: report.mustCoverJson,
      negativePr: report.negativePrJson,
      stats: report.statsJson,
      generatedAt: report.createdAt,
    };
  }
}
