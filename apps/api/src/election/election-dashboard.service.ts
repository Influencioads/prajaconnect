import { Injectable } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { CampaignWorkStatus, ElectionExpenseStatus, ElectionVehicleStatus } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { ElectionCommonService } from './election-common.service';
import { ElectionScopeDto } from './dto/election.dto';

@Injectable()
export class ElectionDashboardService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async getDashboard(query: ElectionScopeDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: { constituency: { select: { id: true, name: true } } },
    });

    const expenseAgg = await this.prisma.electionExpense.aggregate({
      where: { electionId, status: ElectionExpenseStatus.Approved },
      _sum: { amount: true },
    });
    const totalExpenses = expenseAgg._sum.amount ?? 0;
    const totalBudget = election?.totalBudget ?? 0;

    const [
      expenseByStatus,
      boothsCovered,
      vehiclesActive,
      worksCompleted,
      worksPending,
      volunteerStrength,
      outreachCount,
      boothPlans,
      dailyExpenses,
      recentWorks,
      recentExpenses,
      recentPolling,
    ] = await Promise.all([
      this.prisma.electionExpense.groupBy({
        by: ['status'],
        where: { electionId },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.electionBoothPlan.count({ where: { electionId } }),
      this.prisma.electionVehicle.count({
        where: { electionId, status: { in: [ElectionVehicleStatus.Assigned, ElectionVehicleStatus.InTransit] } },
      }),
      this.prisma.electionCampaignWork.count({ where: { electionId, status: CampaignWorkStatus.Completed } }),
      this.prisma.electionCampaignWork.count({
        where: {
          electionId,
          status: { in: [CampaignWorkStatus.NotStarted, CampaignWorkStatus.InProgress, CampaignWorkStatus.Delayed] },
        },
      }),
      this.prisma.electionTeamMember.count({ where: { team: { electionId } } }),
      this.prisma.electionVoterOutreach.count({ where: { electionId } }),
      this.prisma.electionBoothPlan.findMany({
        where: { electionId },
        include: {
          booth: {
            select: {
              id: true,
              number: true,
              name: true,
              voterCount: true,
              village: { select: { id: true, name: true, mandal: { select: { id: true, name: true } } } },
            },
          },
        },
      }),
      this.prisma.electionExpense.groupBy({
        by: ['expenseDate'],
        where: { electionId, status: ElectionExpenseStatus.Approved },
        _sum: { amount: true },
        orderBy: { expenseDate: 'desc' },
        take: 14,
      }),
      this.prisma.electionCampaignWork.findMany({
        where: { electionId },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: { id: true, title: true, type: true, status: true, updatedAt: true },
      }),
      this.prisma.electionExpense.findMany({
        where: { electionId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { category: { select: { label: true } } },
      }),
      this.prisma.electionPollingDayUpdate.findMany({
        where: { electionId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { boothPlan: { include: { booth: { select: { number: true, name: true } } } } },
      }),
    ]);

    const readinessAvg =
      boothPlans.length > 0
        ? Math.round(boothPlans.reduce((s, b) => s + b.readinessScore, 0) / boothPlans.length)
        : 0;

    const mandalMap = new Map<string, { mandalId: string; mandalName: string; booths: number; readiness: number; works: number }>();
    for (const plan of boothPlans) {
      const mandal = plan.booth.village.mandal;
      const entry = mandalMap.get(mandal.id) ?? {
        mandalId: mandal.id,
        mandalName: mandal.name,
        booths: 0,
        readiness: 0,
        works: 0,
      };
      entry.booths += 1;
      entry.readiness += plan.readinessScore;
      mandalMap.set(mandal.id, entry);
    }

    const workByMandal = await this.prisma.electionCampaignWork.groupBy({
      by: ['mandalId'],
      where: { electionId, mandalId: { not: null } },
      _count: { _all: true },
    });
    for (const row of workByMandal) {
      if (!row.mandalId) continue;
      const entry = mandalMap.get(row.mandalId);
      if (entry) entry.works = row._count._all;
    }

    const mandalProgress = await Promise.all(
      [...mandalMap.values()].map(async (m) => {
        const mandal = await this.prisma.mandal.findUnique({ where: { id: m.mandalId }, select: { name: true } });
        return {
          mandalId: m.mandalId,
          mandalName: mandal?.name ?? m.mandalName,
          boothsCovered: m.booths,
          avgReadiness: m.booths ? Math.round(m.readiness / m.booths) : 0,
          worksCount: m.works,
        };
      }),
    );

    const boothPerformance = boothPlans
      .map((p) => ({
        boothId: p.boothId,
        boothNumber: p.booth.number,
        boothName: p.booth.name,
        mandalName: p.booth.village.mandal.name,
        readinessScore: p.readinessScore,
        strength: p.strength,
        voterCount: p.voterCount || p.booth.voterCount,
      }))
      .sort((a, b) => b.readinessScore - a.readinessScore)
      .slice(0, 20);

    const timeline: { at: Date; type: string; title: string; meta?: string }[] = [];
    for (const e of recentExpenses) {
      timeline.push({
        at: e.createdAt,
        type: 'expense',
        title: e.title,
        meta: `${e.category.label} · ₹${e.amount}`,
      });
    }
    for (const w of recentWorks) {
      timeline.push({ at: w.updatedAt, type: 'work', title: w.title, meta: w.status });
    }
    for (const p of recentPolling) {
      timeline.push({
        at: p.createdAt,
        type: 'polling',
        title: `Booth ${p.boothPlan.booth.number} · ${p.status}`,
        meta: p.issueText ?? undefined,
      });
    }
    timeline.sort((a, b) => b.at.getTime() - a.at.getTime());

    return {
      election,
      kpis: {
        totalBudget,
        totalExpenses,
        remainingBudget: totalBudget - totalExpenses,
        boothsCovered,
        vehiclesActive,
        worksCompleted,
        pendingWorks: worksPending,
        volunteerStrength,
        voterOutreachCount: outreachCount,
        pollingDayReadinessScore: readinessAvg,
      },
      expenseByStatus,
      mandalProgress,
      boothPerformance,
      dailyExpenseSummary: dailyExpenses.map((d) => ({
        date: d.expenseDate,
        amount: d._sum.amount ?? 0,
      })),
      activityTimeline: timeline.slice(0, 20),
    };
  }
}
