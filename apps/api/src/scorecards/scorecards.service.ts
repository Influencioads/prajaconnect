import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types';

/**
 * Composite weights. Positive weights reward, negative ones penalise.
 * Positives sum to 1.0 so a perfect mandal scores 100; penalties can pull it
 * down to -20 before the final clamp to 0..100.
 *
 * grievanceResolutionPct / attendanceRate / d2dCoverage are already 0..100.
 * activityCount / slaBreaches / openCrises are raw counts, so they are
 * normalised to 0..100 against the busiest (or worst) mandal of that day.
 */
export const COMPOSITE_WEIGHTS = {
  grievanceResolutionPct: 0.35,
  attendanceRate: 0.25,
  d2dCoverage: 0.2,
  activityCount: 0.2,
  slaBreaches: -0.1,
  openCrises: -0.1,
} as const;

/** Leaderboard points awarded per unit of field work. */
export const LEADERBOARD_POINTS = {
  checkIn: 10,
  d2dVisit: 15,
  activity: 10,
  task: 20,
} as const;

/** Rolling window (days) summed into Cadre.performance. */
export const PERFORMANCE_WINDOW_DAYS = 30;

const LEADERBOARD_LIMIT = 50;
const HISTORY_DAYS = 30;

/** Local midnight. Accepts a YYYY-MM-DD string (parsed as a local calendar date) or a Date. */
export function startOfDay(input?: string | Date): Date {
  if (typeof input === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

/** Scale a raw count to 0..100 against the day's maximum. */
function normalise(value: number, max: number): number {
  if (max <= 0) return 0;
  return (value / max) * 100;
}

interface MandalMetrics {
  mandalId: string;
  grievanceResolutionPct: number;
  slaBreaches: number;
  attendanceRate: number;
  d2dCoverage: number;
  activityCount: number;
  openCrises: number;
}

@Injectable()
export class ScorecardsService {
  private readonly logger = new Logger(ScorecardsService.name);

  constructor(private prisma: PrismaService) {}

  /** Setting-table toggle with env fallback, same pattern as PrConfigService. */
  async isEnabled(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'scorecards_enabled' } });
    const value = row?.value ?? process.env.SCORECARDS_ENABLED ?? 'true';
    return value.toLowerCase() !== 'false';
  }

  // ---------------------------------------------------------------- compute

  /** Computes and persists both scorecards and cadre scores for a day (default: yesterday). */
  async runDaily(dateInput?: string) {
    const day = dateInput ? startOfDay(dateInput) : addDays(startOfDay(), -1);
    const next = addDays(day, 1);
    const mandals = await this.computeMandalScorecards(day, next);
    const cadres = await this.computeCadreScores(day, next);
    this.logger.log(
      `Scorecards for ${day.toDateString()}: ${mandals} mandals, ${cadres} cadres scored`,
    );
    return { date: day.toISOString(), mandals, cadres };
  }

  private async computeMandalScorecards(day: Date, next: Date): Promise<number> {
    const mandals = await this.prisma.mandal.findMany({ select: { id: true } });
    if (!mandals.length) return 0;

    const window = { gte: day, lt: next };
    const [
      grievanceGroups,
      slaRows,
      attendanceRows,
      activeCadreGroups,
      householdGroups,
      surveyedGroups,
      activityGroups,
      crisisGroups,
    ] = await Promise.all([
      this.prisma.grievance.groupBy({
        by: ['mandalId', 'status'],
        _count: true,
        where: { mandalId: { not: null }, createdAt: { lt: next } },
      }),
      this.prisma.grievanceSlaViolation.findMany({
        where: { breachedAt: window },
        select: { grievance: { select: { mandalId: true } } },
      }),
      this.prisma.volunteerAttendance.findMany({
        where: { checkInAt: window },
        select: { cadreId: true, cadre: { select: { mandalId: true } } },
      }),
      this.prisma.cadre.groupBy({
        by: ['mandalId'],
        _count: true,
        where: { mandalId: { not: null }, status: 'Active' },
      }),
      this.prisma.d2DHousehold.groupBy({
        by: ['mandalId'],
        _count: true,
        where: { mandalId: { not: null }, createdAt: { lt: next } },
      }),
      this.prisma.d2DHousehold.groupBy({
        by: ['mandalId'],
        _count: true,
        where: { mandalId: { not: null }, createdAt: { lt: next }, responses: { some: {} } },
      }),
      this.prisma.activity.groupBy({
        by: ['mandalId'],
        _count: true,
        where: { mandalId: { not: null }, createdAt: window },
      }),
      this.prisma.crisisIssue.groupBy({
        by: ['mandalId'],
        _count: true,
        where: { mandalId: { not: null }, status: { in: ['Open', 'Active'] }, createdAt: { lt: next } },
      }),
    ]);

    const grievanceTotal = new Map<string, number>();
    const grievanceResolved = new Map<string, number>();
    for (const g of grievanceGroups) {
      if (!g.mandalId) continue;
      grievanceTotal.set(g.mandalId, (grievanceTotal.get(g.mandalId) ?? 0) + g._count);
      if (g.status === 'Resolved' || g.status === 'Closed') {
        grievanceResolved.set(g.mandalId, (grievanceResolved.get(g.mandalId) ?? 0) + g._count);
      }
    }

    const slaByMandal = new Map<string, number>();
    for (const row of slaRows) {
      const id = row.grievance?.mandalId;
      if (!id) continue;
      slaByMandal.set(id, (slaByMandal.get(id) ?? 0) + 1);
    }

    // A cadre checking in twice in a day still counts once towards attendance.
    const presentCadres = new Map<string, Set<string>>();
    for (const row of attendanceRows) {
      const id = row.cadre?.mandalId;
      if (!id) continue;
      const set = presentCadres.get(id) ?? new Set<string>();
      set.add(row.cadreId);
      presentCadres.set(id, set);
    }

    const countMap = (groups: { mandalId: string | null; _count: number }[]) => {
      const m = new Map<string, number>();
      for (const g of groups) if (g.mandalId) m.set(g.mandalId, g._count);
      return m;
    };
    const activeCadres = countMap(activeCadreGroups);
    const households = countMap(householdGroups);
    const surveyed = countMap(surveyedGroups);
    const activities = countMap(activityGroups);
    const crises = countMap(crisisGroups);

    const metrics: MandalMetrics[] = mandals.map((m) => ({
      mandalId: m.id,
      grievanceResolutionPct: pct(grievanceResolved.get(m.id) ?? 0, grievanceTotal.get(m.id) ?? 0),
      slaBreaches: slaByMandal.get(m.id) ?? 0,
      attendanceRate: pct(presentCadres.get(m.id)?.size ?? 0, activeCadres.get(m.id) ?? 0),
      d2dCoverage: pct(surveyed.get(m.id) ?? 0, households.get(m.id) ?? 0),
      activityCount: activities.get(m.id) ?? 0,
      openCrises: crises.get(m.id) ?? 0,
    }));

    const maxActivity = Math.max(0, ...metrics.map((m) => m.activityCount));
    const maxSla = Math.max(0, ...metrics.map((m) => m.slaBreaches));
    const maxCrises = Math.max(0, ...metrics.map((m) => m.openCrises));

    const scored = metrics
      .map((m) => {
        const raw =
          COMPOSITE_WEIGHTS.grievanceResolutionPct * m.grievanceResolutionPct +
          COMPOSITE_WEIGHTS.attendanceRate * m.attendanceRate +
          COMPOSITE_WEIGHTS.d2dCoverage * m.d2dCoverage +
          COMPOSITE_WEIGHTS.activityCount * normalise(m.activityCount, maxActivity) +
          COMPOSITE_WEIGHTS.slaBreaches * normalise(m.slaBreaches, maxSla) +
          COMPOSITE_WEIGHTS.openCrises * normalise(m.openCrises, maxCrises);
        const composite = Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;
        return { ...m, composite };
      })
      .sort((a, b) => b.composite - a.composite);

    for (const [i, row] of scored.entries()) {
      const { mandalId, ...data } = row;
      await this.prisma.mandalScorecard.upsert({
        where: { mandalId_date: { mandalId, date: day } },
        create: { mandalId, date: day, ...data, rank: i + 1 },
        update: { ...data, rank: i + 1 },
      });
    }
    return scored.length;
  }

  private async computeCadreScores(day: Date, next: Date): Promise<number> {
    const window = { gte: day, lt: next };
    const [checkInGroups, d2dGroups, activityGroups, taskGroups] = await Promise.all([
      this.prisma.volunteerAttendance.groupBy({
        by: ['cadreId'],
        _count: true,
        where: { checkInAt: window },
      }),
      this.prisma.d2DSurveyResponse.groupBy({
        by: ['surveyorCadreId'],
        _count: true,
        where: { surveyorCadreId: { not: null }, submittedAt: window },
      }),
      this.prisma.activity.groupBy({
        by: ['cadreId'],
        _count: true,
        where: { cadreId: { not: null }, createdAt: window },
      }),
      this.prisma.activity.groupBy({
        by: ['cadreId'],
        _count: true,
        where: { cadreId: { not: null }, type: 'Task', status: 'Completed', completedAt: window },
      }),
    ]);

    type Row = { checkIns: number; d2dVisits: number; activities: number; tasksCompleted: number };
    const rows = new Map<string, Row>();
    const bump = (id: string | null, key: keyof Row, n: number) => {
      if (!id) return;
      const row = rows.get(id) ?? { checkIns: 0, d2dVisits: 0, activities: 0, tasksCompleted: 0 };
      row[key] += n;
      rows.set(id, row);
    };
    for (const g of checkInGroups) bump(g.cadreId, 'checkIns', g._count);
    for (const g of d2dGroups) bump(g.surveyorCadreId, 'd2dVisits', g._count);
    for (const g of activityGroups) bump(g.cadreId, 'activities', g._count);
    for (const g of taskGroups) bump(g.cadreId, 'tasksCompleted', g._count);

    for (const [cadreId, row] of rows) {
      const points =
        row.checkIns * LEADERBOARD_POINTS.checkIn +
        row.d2dVisits * LEADERBOARD_POINTS.d2dVisit +
        row.activities * LEADERBOARD_POINTS.activity +
        row.tasksCompleted * LEADERBOARD_POINTS.task;
      const data = { ...row, points };
      await this.prisma.cadreScoreDaily.upsert({
        where: { cadreId_date: { cadreId, date: day } },
        create: { cadreId, date: day, ...data },
        update: data,
      });
    }

    await this.refreshPerformanceScores(next);
    return rows.size;
  }

  /** Cadre.performance = rolling 30-day sum of daily leaderboard points. */
  private async refreshPerformanceScores(next: Date) {
    const from = addDays(next, -PERFORMANCE_WINDOW_DAYS);
    const totals = await this.prisma.cadreScoreDaily.groupBy({
      by: ['cadreId'],
      _sum: { points: true },
      where: { date: { gte: from, lt: next } },
    });
    // Reset first so cadres who dropped out of the window fall back to zero.
    await this.prisma.cadre.updateMany({ where: { performance: { not: 0 } }, data: { performance: 0 } });
    for (const t of totals) {
      await this.prisma.cadre.update({
        where: { id: t.cadreId },
        data: { performance: t._sum.points ?? 0 },
      });
    }
  }

  // ----------------------------------------------------------------- reads

  /** Restrict to the caller's constituency, the way neighbouring modules scope geography. */
  private mandalScope(user?: AuthenticatedUser): Prisma.MandalScorecardWhereInput {
    return user?.constituencyId ? { mandal: { constituencyId: user.constituencyId } } : {};
  }

  private cadreScope(user?: AuthenticatedUser): Prisma.CadreScoreDailyWhereInput {
    return user?.constituencyId ? { cadre: { constituencyId: user.constituencyId } } : {};
  }

  async listMandals(user: AuthenticatedUser, dateInput?: string) {
    const scope = this.mandalScope(user);
    const date = dateInput
      ? startOfDay(dateInput)
      : (
          await this.prisma.mandalScorecard.findFirst({
            where: scope,
            orderBy: { date: 'desc' },
            select: { date: true },
          })
        )?.date;
    if (!date) return { date: null, previousDate: null, data: [], movers: { best: [], worst: [] } };

    const [rows, previous] = await Promise.all([
      this.prisma.mandalScorecard.findMany({
        where: { ...scope, date },
        orderBy: { rank: 'asc' },
        include: { mandal: { select: { id: true, name: true } } },
      }),
      this.prisma.mandalScorecard.findFirst({
        where: { ...scope, date: { lt: date } },
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
    ]);

    const prevRows = previous
      ? await this.prisma.mandalScorecard.findMany({
          where: { ...scope, date: previous.date },
          select: { mandalId: true, rank: true, composite: true },
        })
      : [];
    const prevByMandal = new Map(prevRows.map((p) => [p.mandalId, p]));

    const data = rows.map((r) => {
      const prev = prevByMandal.get(r.mandalId);
      return {
        ...r,
        previousRank: prev?.rank ?? null,
        // Positive means the mandal climbed the table since the previous run.
        rankDelta: prev ? prev.rank - r.rank : 0,
        compositeDelta: prev ? Math.round((r.composite - prev.composite) * 10) / 10 : 0,
      };
    });

    const moved = data.filter((d) => d.previousRank !== null && d.rankDelta !== 0);
    const byDelta = [...moved].sort((a, b) => b.rankDelta - a.rankDelta);
    return {
      date,
      previousDate: previous?.date ?? null,
      data,
      movers: {
        best: byDelta.filter((d) => d.rankDelta > 0).slice(0, 3),
        worst: byDelta.filter((d) => d.rankDelta < 0).slice(-3).reverse(),
      },
    };
  }

  async mandalHistory(user: AuthenticatedUser, mandalId: string) {
    const from = addDays(startOfDay(), -HISTORY_DAYS);
    const data = await this.prisma.mandalScorecard.findMany({
      where: { ...this.mandalScope(user), mandalId, date: { gte: from } },
      orderBy: { date: 'asc' },
    });
    return { mandalId, data };
  }

  async leaderboard(user: AuthenticatedUser, period?: string) {
    const days = period === 'monthly' ? 30 : period === 'weekly' ? 7 : 1;
    const scope = this.cadreScope(user);
    const latest = await this.prisma.cadreScoreDaily.findFirst({
      where: scope,
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    if (!latest) {
      return { period: period ?? 'daily', from: null, to: null, data: [], me: null };
    }
    const to = addDays(latest.date, 1);
    const from = addDays(latest.date, -(days - 1));

    const totals = await this.prisma.cadreScoreDaily.groupBy({
      by: ['cadreId'],
      _sum: { points: true, checkIns: true, d2dVisits: true, activities: true, tasksCompleted: true },
      where: { ...scope, date: { gte: from, lt: to } },
      orderBy: { _sum: { points: 'desc' } },
    });

    const myCadre = await this.prisma.cadre.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    const myIndex = myCadre ? totals.findIndex((t) => t.cadreId === myCadre.id) : -1;

    const topIds = totals.slice(0, LEADERBOARD_LIMIT).map((t) => t.cadreId);
    const wantedIds = myIndex >= 0 && myIndex >= LEADERBOARD_LIMIT ? [...topIds, myCadre!.id] : topIds;
    const cadres = await this.prisma.cadre.findMany({
      where: { id: { in: wantedIds } },
      select: {
        id: true,
        name: true,
        designation: true,
        photo: true,
        performance: true,
        mandal: { select: { id: true, name: true } },
        booth: { select: { number: true } },
      },
    });
    const cadreById = new Map(cadres.map((c) => [c.id, c]));

    const shape = (index: number) => {
      const t = totals[index];
      const cadre = cadreById.get(t.cadreId);
      if (!cadre) return null;
      return {
        rank: index + 1,
        cadre,
        points: t._sum.points ?? 0,
        checkIns: t._sum.checkIns ?? 0,
        d2dVisits: t._sum.d2dVisits ?? 0,
        activities: t._sum.activities ?? 0,
        tasksCompleted: t._sum.tasksCompleted ?? 0,
      };
    };

    return {
      period: period ?? 'daily',
      from,
      to: latest.date,
      total: totals.length,
      data: topIds.map((_, i) => shape(i)).filter(Boolean),
      me: myIndex >= 0 ? shape(myIndex) : null,
    };
  }

  async cadreHistory(user: AuthenticatedUser, cadreId: string) {
    const from = addDays(startOfDay(), -HISTORY_DAYS);
    const data = await this.prisma.cadreScoreDaily.findMany({
      where: { ...this.cadreScope(user), cadreId, date: { gte: from } },
      orderBy: { date: 'asc' },
    });
    return { cadreId, data };
  }
}
