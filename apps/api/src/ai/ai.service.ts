import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ScoreBand = 'Critical' | 'At Risk' | 'Stable' | 'Strong';

function band(score: number): ScoreBand {
  if (score < 40) return 'Critical';
  if (score < 60) return 'At Risk';
  if (score < 80) return 'Stable';
  return 'Strong';
}

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  /** Rule-based constituency health score from live service-delivery data. */
  async constituencyHealth() {
    const [
      grievancesTotal,
      grievancesResolved,
      grievancesOpen,
      slaBreached,
      beneficiariesTotal,
      beneficiariesDisbursed,
      projectsAgg,
      eventsTotal,
      eventsCompleted,
    ] = await Promise.all([
      this.prisma.grievance.count(),
      this.prisma.grievance.count({ where: { status: { in: ['Resolved', 'Closed'] } } }),
      this.prisma.grievance.count({ where: { status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] } } }),
      this.prisma.grievance.count({
        where: { status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] }, slaDueAt: { lt: new Date() } },
      }),
      this.prisma.beneficiary.count(),
      this.prisma.beneficiary.count({ where: { status: { in: ['Disbursed', 'Enrolled'] } } }),
      this.prisma.developmentProject.aggregate({ _avg: { progressPct: true } }),
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: 'Completed' } }),
    ]);

    const resolutionRate = pct(grievancesResolved, grievancesTotal);
    const slaCompliance = grievancesOpen ? clamp(100 - pct(slaBreached, grievancesOpen)) : 100;
    const welfareCoverage = pct(beneficiariesDisbursed, beneficiariesTotal);
    const projectProgress = Math.round(projectsAgg._avg.progressPct ?? 0);
    const eventDelivery = pct(eventsCompleted, eventsTotal);

    const components = [
      { label: 'Grievance Resolution', value: resolutionRate, weight: 0.3 },
      { label: 'SLA Compliance', value: slaCompliance, weight: 0.2 },
      { label: 'Welfare Coverage', value: welfareCoverage, weight: 0.2 },
      { label: 'Project Progress', value: projectProgress, weight: 0.2 },
      { label: 'Event Delivery', value: eventDelivery, weight: 0.1 },
    ];
    const score = clamp(components.reduce((acc, c) => acc + c.value * c.weight, 0));

    return { score, band: band(score), components };
  }

  /** Rule-based election readiness from organisational coverage. */
  async electionReadiness() {
    const [boothsTotal, boothsWithCadre, citizens, voterAgg, volunteers, activeCadre, totalCadre] = await Promise.all([
      this.prisma.booth.count(),
      this.prisma.cadre.findMany({ where: { boothId: { not: null } }, distinct: ['boothId'], select: { boothId: true } }),
      this.prisma.citizen.count(),
      this.prisma.booth.aggregate({ _sum: { voterCount: true } }),
      this.prisma.cadre.count({ where: { status: 'Active' } }),
      this.prisma.cadre.count({ where: { status: 'Active' } }),
      this.prisma.cadre.count(),
    ]);

    const boothCoverage = pct(boothsWithCadre.length, boothsTotal);
    const totalVoters = voterAgg._sum.voterCount ?? 0;
    const voterReach = totalVoters ? clamp(pct(citizens, totalVoters)) : 0;
    // healthy ratio ~ 1 active volunteer per booth
    const volunteerStrength = boothsTotal ? clamp(pct(volunteers, boothsTotal)) : 0;
    const cadreActivity = pct(activeCadre, totalCadre);

    const components = [
      { label: 'Booth Coverage', value: boothCoverage, weight: 0.35 },
      { label: 'Voter Database Reach', value: voterReach, weight: 0.25 },
      { label: 'Volunteer Strength', value: volunteerStrength, weight: 0.25 },
      { label: 'Cadre Activity', value: cadreActivity, weight: 0.15 },
    ];
    const score = clamp(components.reduce((acc, c) => acc + c.value * c.weight, 0));

    return { score, band: band(score), components, boothsTotal, boothsCovered: boothsWithCadre.length };
  }

  /** Rule-based public sentiment from feedback + grievance pressure. */
  async publicSentiment() {
    const [ratingAgg, ratedCount, grievancesOpen, grievancesTotal, highPriorityOpen, surveyResponses] =
      await Promise.all([
        this.prisma.grievance.aggregate({ _avg: { satisfactionRating: true }, where: { satisfactionRating: { not: null } } }),
        this.prisma.grievance.count({ where: { satisfactionRating: { not: null } } }),
        this.prisma.grievance.count({ where: { status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] } } }),
        this.prisma.grievance.count(),
        this.prisma.grievance.count({ where: { priority: 'High', status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] } } }),
        this.prisma.surveyResponse.count(),
      ]);

    const avgRating = ratingAgg._avg.satisfactionRating ?? 0;
    const satisfaction = avgRating ? clamp((avgRating / 5) * 100) : 60; // neutral baseline when no feedback
    const backlogPressure = clamp(100 - pct(grievancesOpen, grievancesTotal));
    const escalationPressure = clamp(100 - pct(highPriorityOpen, grievancesTotal));

    const components = [
      { label: 'Citizen Satisfaction', value: satisfaction, weight: 0.5 },
      { label: 'Backlog Pressure', value: backlogPressure, weight: 0.3 },
      { label: 'Escalation Pressure', value: escalationPressure, weight: 0.2 },
    ];
    const score = clamp(components.reduce((acc, c) => acc + c.value * c.weight, 0));

    return { score, band: band(score), components, sampleSize: ratedCount, surveyResponses, avgRating: Math.round(avgRating * 10) / 10 };
  }

  /** Grievance risk alerts: SLA breaches and mandal hotspots. */
  async riskAlerts() {
    const now = new Date();
    const [breached, hotspots] = await Promise.all([
      this.prisma.grievance.findMany({
        where: {
          status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] },
          slaDueAt: { lt: now },
        },
        orderBy: { slaDueAt: 'asc' },
        take: 10,
        include: { mandal: { select: { name: true } }, department: { select: { name: true } } },
      }),
      this.prisma.grievance.groupBy({
        by: ['mandalId'],
        where: { status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] } },
        _count: { _all: true },
        orderBy: { _count: { mandalId: 'desc' } },
        take: 5,
      }),
    ]);

    const mandalIds = hotspots.map((h) => h.mandalId).filter((id): id is string => !!id);
    const mandals = mandalIds.length
      ? await this.prisma.mandal.findMany({ where: { id: { in: mandalIds } }, select: { id: true, name: true } })
      : [];
    const mandalMap = new Map(mandals.map((m) => [m.id, m.name]));

    const slaAlerts = breached.map((g) => {
      const overdueDays = g.slaDueAt ? Math.max(1, Math.ceil((now.getTime() - g.slaDueAt.getTime()) / 86400000)) : 0;
      return {
        id: g.id,
        code: g.code,
        title: g.title,
        priority: g.priority,
        status: g.status,
        mandal: g.mandal?.name ?? null,
        department: g.department?.name ?? null,
        overdueDays,
        severity: g.priority === 'High' || overdueDays > 7 ? 'High' : 'Medium',
      };
    });

    const hotspotAlerts = hotspots
      .filter((h) => h.mandalId)
      .map((h) => ({
        mandal: mandalMap.get(h.mandalId as string) ?? 'Unknown',
        openGrievances: h._count._all,
        severity: h._count._all >= 10 ? 'High' : h._count._all >= 5 ? 'Medium' : 'Low',
      }));

    return { slaAlerts, hotspotAlerts, slaBreachCount: slaAlerts.length };
  }

  /** Daily briefing (rule-based narrative; LLM integration is stubbed). */
  async dailyBriefing() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [newGrievances, resolvedToday, upcomingEvents, newBeneficiaries, health] = await Promise.all([
      this.prisma.grievance.count({ where: { createdAt: { gte: since } } }),
      this.prisma.grievance.count({ where: { resolvedAt: { gte: since } } }),
      this.prisma.event.count({ where: { startAt: { gte: new Date() }, status: { in: ['Scheduled', 'Ongoing'] } } }),
      this.prisma.beneficiary.count({ where: { appliedAt: { gte: since } } }),
      this.constituencyHealth(),
    ]);

    const headlines = [
      `Constituency health is ${health.band.toLowerCase()} at ${health.score}/100.`,
      `${newGrievances} new grievance(s) logged and ${resolvedToday} resolved in the last 24 hours.`,
      `${upcomingEvents} upcoming event(s) scheduled.`,
      `${newBeneficiaries} new welfare application(s) received.`,
    ];

    return {
      date: new Date().toISOString().slice(0, 10),
      generatedBy: 'rule-engine',
      headlines,
      metrics: { newGrievances, resolvedToday, upcomingEvents, newBeneficiaries, healthScore: health.score },
      note: 'LLM-generated narrative briefings are stubbed; this summary is computed from live data.',
    };
  }

  async overview() {
    const [health, readiness, sentiment, alerts, briefing, prBriefing] = await Promise.all([
      this.constituencyHealth(),
      this.electionReadiness(),
      this.publicSentiment(),
      this.riskAlerts(),
      this.dailyBriefing(),
      this.prBriefing(),
    ]);
    return { health, readiness, sentiment, alerts, briefing, prBriefing };
  }

  /** Latest AI PR Management 4-hour digest (from automated news cycle). */
  async prBriefing() {
    const report = await this.prisma.prReport.findFirst({ orderBy: { createdAt: 'desc' } });
    const openPrAlerts = await this.prisma.prAlert.count({
      where: { status: 'Open' },
    });
    if (!report) {
      return {
        available: false,
        openPrAlerts,
        summary: 'No PR intelligence reports yet. The 4-hour news cycle will populate this section.',
      };
    }
    return {
      available: true,
      openPrAlerts,
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
