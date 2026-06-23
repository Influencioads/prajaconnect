import { Injectable, Logger } from '@nestjs/common';
import { GrievanceSlaViolationStatus, GrievanceSlaViolationType } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardResult {
  data: unknown;
  serverTiming: string;
  cached: boolean;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly cacheTtlMs = Number(process.env.DASHBOARD_CACHE_TTL_MS) || 30_000;
  private cache: { data: unknown; serverTiming: string; expiresAt: number } | null = null;

  constructor(private prisma: PrismaService) {}

  async summary() {
    const [
      citizens,
      cadre,
      activeCadre,
      grievancesTotal,
      grievancesOpen,
      grievancesResolved,
      beneficiaries,
      whatsappConversations,
      events,
      projects,
      schemes,
      slaValidationBreached,
      slaResolutionBreached,
    ] = await Promise.all([
      this.prisma.citizen.count(),
      this.prisma.cadre.count(),
      this.prisma.cadre.count({ where: { status: 'Active' } }),
      this.prisma.grievance.count(),
      this.prisma.grievance.count({ where: { status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] } } }),
      this.prisma.grievance.count({ where: { status: { in: ['Resolved', 'Closed'] } } }),
      this.prisma.beneficiary.count(),
      this.prisma.whatsappConversation.count(),
      this.prisma.event.count(),
      this.prisma.developmentProject.count(),
      this.prisma.scheme.count(),
      this.prisma.grievanceSlaViolation.count({
        where: { status: GrievanceSlaViolationStatus.Open, type: GrievanceSlaViolationType.Validation },
      }),
      this.prisma.grievanceSlaViolation.count({
        where: { status: GrievanceSlaViolationStatus.Open, type: GrievanceSlaViolationType.Resolution },
      }),
    ]);

    const resolutionRate = grievancesTotal ? Math.round((grievancesResolved / grievancesTotal) * 100) : 0;

    return {
      kpis: {
        citizens,
        cadre,
        activeCadre,
        grievancesTotal,
        grievancesOpen,
        grievancesResolved,
        resolutionRate,
        beneficiaries,
        whatsappConversations,
        events,
        projects,
        schemes,
        slaValidationBreached,
        slaResolutionBreached,
        slaTotalBreached: slaValidationBreached + slaResolutionBreached,
      },
    };
  }

  async grievanceByStatus() {
    const grouped = await this.prisma.grievance.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }

  async grievanceByPriority() {
    const grouped = await this.prisma.grievance.groupBy({
      by: ['priority'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ priority: g.priority, count: g._count._all }));
  }

  async byMandal() {
    const mandals = await this.prisma.mandal.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { citizens: true, cadres: true, grievances: true } },
      },
    });

    const [openByMandal, resolvedByMandal] = await Promise.all([
      this.prisma.grievance.groupBy({
        by: ['mandalId'],
        where: { status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] } },
        _count: { _all: true },
      }),
      this.prisma.grievance.groupBy({
        by: ['mandalId'],
        where: { status: { in: ['Resolved', 'Closed'] } },
        _count: { _all: true },
      }),
    ]);
    const openMap = new Map(openByMandal.map((g) => [g.mandalId, g._count._all]));
    const resolvedMap = new Map(resolvedByMandal.map((g) => [g.mandalId, g._count._all]));

    return mandals.map((m) => ({
      mandal: m.name,
      citizens: m._count.citizens,
      cadres: m._count.cadres,
      grievances: m._count.grievances,
      open: openMap.get(m.id) ?? 0,
      resolved: resolvedMap.get(m.id) ?? 0,
    }));
  }

  async recentGrievances() {
    const items = await this.prisma.grievance.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: { select: { name: true } },
        department: { select: { name: true } },
        mandal: { select: { name: true } },
      },
    });
    return items.map((g) => ({
      id: g.id,
      code: g.code,
      title: g.title,
      status: g.status,
      priority: g.priority,
      citizen: g.citizen?.name ?? g.reportedByName,
      department: g.department?.name,
      mandal: g.mandal?.name,
      createdAt: g.createdAt,
    }));
  }

  async recentActivity() {
    const updates = await this.prisma.grievanceUpdate.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { grievance: { select: { code: true, title: true } } },
    });
    return updates.map((u) => ({
      id: u.id,
      action: u.action,
      note: u.note,
      by: u.byName,
      grievanceCode: u.grievance.code,
      grievanceTitle: u.grievance.title,
      toStatus: u.toStatus,
      createdAt: u.createdAt,
    }));
  }

  async grievanceTrend() {
    // last 14 days created vs resolved
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const created = await this.prisma.grievance.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const resolved = await this.prisma.grievance.findMany({
      where: { resolvedAt: { gte: since } },
      select: { resolvedAt: true },
    });

    const days: { date: string; created: number; resolved: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, created: 0, resolved: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const c of created) {
      const k = c.createdAt.toISOString().slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) days[i].created++;
    }
    for (const r of resolved) {
      if (!r.resolvedAt) continue;
      const k = r.resolvedAt.toISOString().slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) days[i].resolved++;
    }
    return days.map((d) => ({ date: d.date.slice(5), created: d.created, resolved: d.resolved }));
  }

  /** Computes the full payload, measuring each section's wall-clock time. */
  private async compute(): Promise<{ data: unknown; serverTiming: string }> {
    const timings: Record<string, number> = {};
    const t0 = Date.now();
    const timed = async <T>(label: string, p: Promise<T>): Promise<T> => {
      const start = Date.now();
      const result = await p;
      timings[label] = Date.now() - start;
      return result;
    };

    const [summary, byStatus, byPriority, mandal, recent, activity, trend] = await Promise.all([
      timed('summary', this.summary()),
      timed('byStatus', this.grievanceByStatus()),
      timed('byPriority', this.grievanceByPriority()),
      timed('byMandal', this.byMandal()),
      timed('recent', this.recentGrievances()),
      timed('activity', this.recentActivity()),
      timed('trend', this.grievanceTrend()),
    ]);

    const total = Date.now() - t0;
    this.logger.debug(
      `dashboard.full computed in ${total}ms — ${Object.entries(timings)
        .map(([k, v]) => `${k}=${v}ms`)
        .join(' ')}`,
    );
    const serverTiming =
      Object.entries(timings)
        .map(([k, v]) => `${k};dur=${v}`)
        .join(', ') + `, total;dur=${total}`;

    const data = {
      ...summary,
      grievanceByStatus: byStatus,
      grievanceByPriority: byPriority,
      byMandal: mandal,
      recentGrievances: recent,
      recentActivity: activity,
      grievanceTrend: trend,
    };
    return { data, serverTiming };
  }

  /** Cached for cacheTtlMs; the payload is global (not user-scoped) today. */
  async full(): Promise<DashboardResult> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return {
        data: this.cache.data,
        serverTiming: `${this.cache.serverTiming}, cache;desc=hit`,
        cached: true,
      };
    }
    const { data, serverTiming } = await this.compute();
    this.cache = { data, serverTiming, expiresAt: now + this.cacheTtlMs };
    return { data, serverTiming: `${serverTiming}, cache;desc=miss`, cached: false };
  }
}
