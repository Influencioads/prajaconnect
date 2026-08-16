import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { WarRoomAlertSeverity } from '@praja/database';
import { AiCoreService } from '../ai-core/ai-core.service';
import { PrismaService } from '../prisma/prisma.service';
import { WarRoomService } from '../war-room/war-room.service';
import type { AuthenticatedUser } from '../common/types';

// Type aliases (not interfaces) so these stay assignable to Prisma's Json input types.
export type IntelTheme = {
  theme: string;
  count: number;
  sentiment: string;
  sampleQuotes: string[];
};

export type IntelEmergingIssue = {
  issue: string;
  areas: string[];
  growth: number;
  count: number;
  priorCount: number;
};

/** Growth (%) and minimum volume at which an emerging issue also raises a war-room alert. */
const ALERT_GROWTH_PCT = 50;
const ALERT_MIN_COUNT = 3;
const MAX_QUOTES = 300;

const STOPWORDS = new Set(
  ('the a an and or but is are was were be been being of to in for on with at by from we our us they them it this that these those not no yes ' +
    'very more most some all any has have had will would can could should shall may might do does did done there here about into than then when ' +
    'what which who whom why how also just only much many because since after before over under again still even said says say told ask asked ' +
    'people problem issue village need needs want wants good bad')
    .split(' '),
);

function tokenize(texts: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of texts) {
    for (const raw of t.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (raw.length < 4 || STOPWORDS.has(raw)) continue;
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
  }
  return counts;
}

/** Free-text values are stored as Json; accept plain strings and { text } shapes. */
function asText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object' && typeof (value as { text?: unknown }).text === 'string') {
    return ((value as { text: string }).text || '').trim() || null;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

@Injectable()
export class IntelD2dService {
  private readonly logger = new Logger(IntelD2dService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ai: AiCoreService,
    private warRoom: WarRoomService,
  ) {}

  /** Setting-table toggle with env fallback, same pattern as PrConfigService. */
  async isEnabled(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'intel_enabled' } });
    const val = row?.value || this.config.get('INTEL_ENABLED', 'true');
    return String(val).toLowerCase() !== 'false';
  }

  /** Weekly mining run, Sundays 03:00. */
  @Cron('0 3 * * 0')
  async weeklyRun() {
    try {
      if (!(await this.isEnabled())) {
        this.logger.log('intel_enabled is off; skipping weekly D2D mining');
        return;
      }
      const insight = await this.run(7);
      this.logger.log(`D2D mining completed (${insight.generatedBy}) for ${insight.scope}`);
    } catch (err) {
      this.logger.error('Scheduled D2D mining failed', err as Error);
    }
  }

  async latest(scope?: string) {
    return this.prisma.d2DInsight.findFirst({
      where: scope ? { scope } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async run(days = 7, user?: AuthenticatedUser) {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - days * 86400000);
    const priorStart = new Date(periodStart.getTime() - days * 86400000);

    // Callers pinned to a mandal only mine their own patch; constituency leads see everything.
    const mandalId = user?.mandalId ?? undefined;
    const householdFilter = mandalId ? { household: { mandalId } } : {};
    const scope = mandalId ? 'mandal' : 'constituency';

    const [answers, responses] = await Promise.all([
      this.prisma.d2DResponseAnswer.findMany({
        where: {
          question: { type: 'Text' },
          response: { submittedAt: { gte: periodStart }, ...householdFilter },
        },
        select: {
          value: true,
          response: {
            select: {
              sentiment: true,
              household: {
                select: { village: { select: { name: true } }, mandal: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_QUOTES,
      }),
      // Both windows in one pass so growth is computed on identical filters.
      this.prisma.d2DSurveyResponse.findMany({
        where: { submittedAt: { gte: priorStart }, ...householdFilter },
        select: {
          issues: true,
          sentiment: true,
          submittedAt: true,
          household: {
            select: { village: { select: { name: true } }, mandal: { select: { name: true } } },
          },
        },
        // ponytail: flat cap; move to groupBy if a constituency ever exceeds this in two weeks.
        take: 5000,
      }),
    ]);

    const quotes = answers
      .map((a) => asText(a.value))
      .filter((t): t is string => !!t)
      .slice(0, MAX_QUOTES);

    const current = responses.filter((r) => r.submittedAt >= periodStart);
    const prior = responses.filter((r) => r.submittedAt < periodStart);
    const sentimentShift = this.buildSentimentShift(current, prior);
    const issueStats = this.buildIssueStats(current, prior);

    const analysed =
      (await this.aiThemes(quotes, issueStats, sentimentShift)) ?? this.heuristicThemes(quotes, answers);

    const insight = await this.prisma.d2DInsight.create({
      data: {
        periodStart,
        periodEnd,
        scope,
        scopeId: mandalId ?? null,
        themes: analysed.themes,
        emergingIssues: issueStats,
        sentimentShift,
        generatedBy: analysed.ai ? 'ai' : 'heuristic',
      },
    });

    await this.raiseAlerts(issueStats, mandalId, user?.id);
    return insight;
  }

  private buildSentimentShift(
    current: { sentiment: string | null }[],
    prior: { sentiment: string | null }[],
  ) {
    const tally = (rows: { sentiment: string | null }[]) => {
      const counts: Record<string, number> = { Supporter: 0, Neutral: 0, Opponent: 0, Undecided: 0 };
      for (const r of rows) if (r.sentiment) counts[r.sentiment] = (counts[r.sentiment] ?? 0) + 1;
      const total = rows.length || 1;
      return {
        ...counts,
        total: rows.length,
        netPct: Math.round(((counts.Supporter - counts.Opponent) / total) * 100),
      };
    };
    const cur = tally(current);
    const pre = tally(prior);
    return { current: cur, prior: pre, deltaNetPct: cur.netPct - pre.netPct };
  }

  private buildIssueStats(
    current: { issues: unknown; household: { village: { name: string } | null; mandal: { name: string } | null } | null }[],
    prior: { issues: unknown }[],
  ): IntelEmergingIssue[] {
    const curCounts = new Map<string, number>();
    const areas = new Map<string, Map<string, number>>();
    for (const r of current) {
      const place = r.household?.village?.name ?? r.household?.mandal?.name;
      for (const issue of asStringArray(r.issues)) {
        curCounts.set(issue, (curCounts.get(issue) ?? 0) + 1);
        if (place) {
          const m = areas.get(issue) ?? new Map<string, number>();
          m.set(place, (m.get(place) ?? 0) + 1);
          areas.set(issue, m);
        }
      }
    }
    const priorCounts = new Map<string, number>();
    for (const r of prior) {
      for (const issue of asStringArray(r.issues)) {
        priorCounts.set(issue, (priorCounts.get(issue) ?? 0) + 1);
      }
    }
    return [...curCounts.entries()]
      .map(([issue, count]) => {
        const priorCount = priorCounts.get(issue) ?? 0;
        const growth = priorCount === 0 ? (count > 0 ? 100 : 0) : Math.round(((count - priorCount) / priorCount) * 100);
        const top = [...(areas.get(issue) ?? new Map<string, number>()).entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);
        return { issue, areas: top, growth, count, priorCount };
      })
      .sort((a, b) => b.growth - a.growth || b.count - a.count)
      .slice(0, 15);
  }

  private async aiThemes(
    quotes: string[],
    issueStats: IntelEmergingIssue[],
    sentimentShift: unknown,
  ): Promise<{ themes: IntelTheme[]; ai: true } | null> {
    if (!quotes.length) return null;
    // Batch the corpus so a long window still fits one prompt.
    const corpus = quotes.slice(0, MAX_QUOTES).map((q, i) => `${i + 1}. ${q}`).join('\n');
    const result = await this.ai.completeJson<{ themes?: IntelTheme[] }>({
      system:
        'You analyse door-to-door voter survey free-text from an Indian constituency. ' +
        'Return JSON: {"themes":[{"theme":"short label","count":number,"sentiment":"positive|negative|neutral|mixed","sampleQuotes":["verbatim",...]}]}. ' +
        'Max 8 themes, ordered by how often they appear. sampleQuotes must be copied verbatim from the input, max 2 each. No commentary.',
      user: `Sentiment shift: ${JSON.stringify(sentimentShift)}\nTagged issue counts: ${JSON.stringify(issueStats.slice(0, 10))}\n\nSurvey comments:\n${corpus}`,
      maxTokens: 1200,
    });
    const themes = Array.isArray(result?.themes) ? result.themes.filter((t) => t?.theme) : [];
    if (!themes.length) return null;
    return { themes, ai: true };
  }

  private heuristicThemes(
    quotes: string[],
    answers: { value: unknown; response: { sentiment: string | null } | null }[],
  ): { themes: IntelTheme[]; ai: false } {
    const counts = tokenize(quotes);
    const themes = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => {
        const matching = answers.filter((a) => (asText(a.value) ?? '').toLowerCase().includes(word));
        const negative = matching.filter((a) => a.response?.sentiment === 'Opponent').length;
        const positive = matching.filter((a) => a.response?.sentiment === 'Supporter').length;
        return {
          theme: word,
          count,
          sentiment: negative > positive ? 'negative' : positive > negative ? 'positive' : 'neutral',
          sampleQuotes: matching.slice(0, 2).map((a) => asText(a.value) ?? '').filter(Boolean),
        };
      });
    return { themes, ai: false };
  }

  private async raiseAlerts(issues: IntelEmergingIssue[], mandalId?: string, userId?: string) {
    for (const i of issues) {
      if (i.growth < ALERT_GROWTH_PCT || i.count < ALERT_MIN_COUNT) continue;
      const title = `Emerging D2D issue: ${i.issue}`;
      const open = await this.prisma.warRoomAlert.findFirst({ where: { title, resolved: false } });
      if (open) continue;
      await this.warRoom.createAlert(
        {
          title,
          message: `"${i.issue}" mentions rose ${i.growth}% (${i.priorCount} → ${i.count}) in door-to-door surveys${
            i.areas.length ? `. Hotspots: ${i.areas.join(', ')}` : ''
          }.`,
          severity: i.growth >= 150 ? WarRoomAlertSeverity.High : WarRoomAlertSeverity.Medium,
          mandalId,
        },
        userId,
      );
    }
  }
}
