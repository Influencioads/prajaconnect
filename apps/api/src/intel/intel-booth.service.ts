import { Injectable, NotFoundException } from '@nestjs/common';
import { AiCoreService } from '../ai-core/ai-core.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types';

/**
 * Transparent risk model. Weights sum to 100; every factor is itself a 0-100
 * "how bad is it" number, so riskScore = weighted mean of the factors.
 */
const WEIGHTS = {
  supporterGap: 30,
  sentimentTrend: 20,
  grievanceDensity: 20,
  resolutionGap: 15,
  schemeGap: 10,
  outreachGap: 5,
} as const;

export type FactorKey = keyof typeof WEIGHTS;

export const FACTOR_LABELS: Record<FactorKey, string> = {
  supporterGap: 'Supporter gap',
  sentimentTrend: 'D2D sentiment trend (60d vs prior)',
  grievanceDensity: 'Open grievance density',
  resolutionGap: 'Unresolved grievance share',
  schemeGap: 'Scheme coverage gap',
  outreachGap: 'Outreach contact gap',
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const RESOLVED = ['Resolved', 'Closed'];
const OPEN = ['Open', 'Assigned', 'InProgress', 'Escalated'];

export interface BoothRisk {
  boothId: string;
  number: string;
  name: string | null;
  village: string | null;
  mandal: string | null;
  voterCount: number;
  riskScore: number;
  factors: { key: FactorKey; label: string; value: number; weight: number }[];
  stats: Record<string, number>;
}

@Injectable()
export class IntelBoothService {
  constructor(
    private prisma: PrismaService,
    private ai: AiCoreService,
  ) {}

  async priority(user?: AuthenticatedUser, limit = 20): Promise<{ weights: typeof WEIGHTS; data: BoothRisk[] }> {
    const all = await this.scoreAll(user);
    return { weights: WEIGHTS, data: all.slice(0, limit) };
  }

  async explain(boothId: string, user?: AuthenticatedUser) {
    const all = await this.scoreAll(user);
    const booth = all.find((b) => b.boothId === boothId);
    if (!booth) throw new NotFoundException('Booth not found in your scope');

    const breakdown = booth.factors
      .map((f) => `- ${f.label}: ${f.value}/100 (weight ${f.weight}%)`)
      .join('\n');
    const fallback =
      `Booth ${booth.number}${booth.name ? ` (${booth.name})` : ''} scores ${booth.riskScore}/100 on campaign risk.\n\n` +
      `Factor breakdown:\n${breakdown}\n\n` +
      `Field stats: ${Object.entries(booth.stats)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}.`;

    const text = await this.ai.completeText({
      system:
        'You are a campaign analyst for an Indian assembly constituency. Given a polling booth risk breakdown, ' +
        'write 3-4 short sentences explaining why the booth is at risk, then a bulleted list of 3-5 concrete, ' +
        'locally actionable recommendations (who does what, this week). Plain text only.',
      user: `${fallback}\n\nRisk weights used: ${JSON.stringify(WEIGHTS)}`,
      maxTokens: 500,
    });

    return {
      booth,
      explanation: text?.trim() || fallback,
      generatedBy: text ? 'ai' : 'heuristic',
    };
  }

  /**
   * One pass over the constituency. Every input is capped so a runaway dataset
   * degrades to "scored on a sample" rather than an OOM.
   * ponytail: flat caps + in-memory rollup; push to SQL aggregates if booth count grows past a few thousand.
   */
  private async scoreAll(user?: AuthenticatedUser): Promise<BoothRisk[]> {
    const mandalId = user?.mandalId ?? undefined;
    const boothWhere = mandalId ? { village: { mandalId } } : {};
    const citizenScope = mandalId ? { boothId: { not: null }, mandalId } : { boothId: { not: null } };

    const now = Date.now();
    const win60 = new Date(now - 60 * 86400000);
    const win120 = new Date(now - 120 * 86400000);

    const [booths, citizenGroups, grievances, beneficiaries, outreachGroups, d2d] = await Promise.all([
      this.prisma.booth.findMany({
        where: boothWhere,
        select: {
          id: true,
          number: true,
          name: true,
          voterCount: true,
          village: { select: { name: true, mandal: { select: { name: true } } } },
          boothVoterStrength: { select: { supporterPct: true, totalProfiles: true } },
        },
      }),
      this.prisma.citizen.groupBy({ by: ['boothId'], _count: { _all: true }, where: citizenScope }),
      this.prisma.grievance.findMany({
        where: { citizen: citizenScope },
        select: { status: true, citizen: { select: { boothId: true } } },
        take: 5000,
      }),
      this.prisma.beneficiary.findMany({
        where: { citizen: citizenScope },
        select: { citizenId: true, citizen: { select: { boothId: true } } },
        take: 5000,
      }),
      this.prisma.electionVoterOutreach.groupBy({
        by: ['boothId'],
        _count: { _all: true },
        where: { boothId: { not: null }, ...(mandalId ? { mandalId } : {}) },
      }),
      this.prisma.d2DSurveyResponse.findMany({
        where: {
          submittedAt: { gte: win120 },
          household: { boothId: { not: null }, ...(mandalId ? { mandalId } : {}) },
        },
        select: { sentiment: true, submittedAt: true, household: { select: { boothId: true } } },
        take: 5000,
      }),
    ]);

    const citizens = new Map(citizenGroups.map((g) => [g.boothId ?? '', g._count._all]));
    const outreach = new Map(outreachGroups.map((g) => [g.boothId ?? '', g._count._all]));

    const open = new Map<string, number>();
    const resolved = new Map<string, number>();
    const totalGrv = new Map<string, number>();
    for (const g of grievances) {
      const b = g.citizen?.boothId;
      if (!b) continue;
      totalGrv.set(b, (totalGrv.get(b) ?? 0) + 1);
      if (OPEN.includes(g.status)) open.set(b, (open.get(b) ?? 0) + 1);
      if (RESOLVED.includes(g.status)) resolved.set(b, (resolved.get(b) ?? 0) + 1);
    }

    const covered = new Map<string, Set<string>>();
    for (const b of beneficiaries) {
      const id = b.citizen?.boothId;
      if (!id) continue;
      const set = covered.get(id) ?? new Set<string>();
      set.add(b.citizenId);
      covered.set(id, set);
    }

    // Net sentiment (% supporter minus % opponent) for the last 60 days and the 60 before that.
    const net = new Map<string, { cur: number[]; pre: number[] }>();
    for (const r of d2d) {
      const b = r.household?.boothId;
      if (!b || !r.sentiment) continue;
      const point = r.sentiment === 'Supporter' ? 1 : r.sentiment === 'Opponent' ? -1 : 0;
      const bucket = net.get(b) ?? { cur: [], pre: [] };
      (r.submittedAt >= win60 ? bucket.cur : bucket.pre).push(point);
      net.set(b, bucket);
    }
    const avgPct = (arr: number[]) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) * 100 : 0);

    const scored = booths.map((booth) => {
      const id = booth.id;
      const people = citizens.get(id) ?? 0;
      const strength = booth.boothVoterStrength;
      const openCount = open.get(id) ?? 0;
      const grvTotal = totalGrv.get(id) ?? 0;
      const resolvedCount = resolved.get(id) ?? 0;
      const coveredCount = covered.get(id)?.size ?? 0;
      const contacted = outreach.get(id) ?? 0;
      const bucket = net.get(id);
      const curNet = avgPct(bucket?.cur ?? []);
      const preNet = avgPct(bucket?.pre ?? []);

      const values: Record<FactorKey, number> = {
        // No profile data yet is treated as "unknown" (50), not "safe".
        supporterGap: strength?.totalProfiles ? clamp(100 - strength.supporterPct) : 50,
        // A 50-point net-sentiment swing either way saturates the factor.
        sentimentTrend: bucket?.cur.length ? clamp(50 - (curNet - preNet)) : 50,
        // 20% of citizens holding an open grievance saturates the factor.
        grievanceDensity: people ? clamp((openCount / people) * 500) : 0,
        resolutionGap: grvTotal ? clamp(100 - (resolvedCount / grvTotal) * 100) : 0,
        schemeGap: people ? clamp(100 - (coveredCount / people) * 100) : 50,
        outreachGap: people ? clamp(100 - (contacted / people) * 100) : 100,
      };

      const riskScore = Math.round(
        (Object.keys(WEIGHTS) as FactorKey[]).reduce((sum, k) => sum + values[k] * WEIGHTS[k], 0) / 100,
      );

      return {
        boothId: id,
        number: booth.number,
        name: booth.name,
        village: booth.village?.name ?? null,
        mandal: booth.village?.mandal?.name ?? null,
        voterCount: booth.voterCount,
        riskScore,
        factors: (Object.keys(WEIGHTS) as FactorKey[]).map((k) => ({
          key: k,
          label: FACTOR_LABELS[k],
          value: values[k],
          weight: WEIGHTS[k],
        })),
        stats: {
          citizens: people,
          supporterPct: Math.round(strength?.supporterPct ?? 0),
          openGrievances: openCount,
          resolvedGrievances: resolvedCount,
          schemeBeneficiaries: coveredCount,
          outreachContacts: contacted,
          d2dResponses60d: bucket?.cur.length ?? 0,
          netSentimentDelta: Math.round(curNet - preNet),
        },
      };
    });

    return scored.sort((a, b) => b.riskScore - a.riskScore);
  }
}
