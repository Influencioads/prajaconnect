import { Injectable } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { D2DAnalyticsQueryDto } from './dto/d2d.dto';

@Injectable()
export class D2dAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async overview(query: D2DAnalyticsQueryDto) {
    const responseWhere: Prisma.D2DSurveyResponseWhereInput = {};
    if (query.surveyId) responseWhere.surveyId = query.surveyId;
    if (query.mandalId || query.villageId || query.boothId) {
      responseWhere.household = {};
      if (query.mandalId) responseWhere.household.mandalId = query.mandalId;
      if (query.villageId) responseWhere.household.villageId = query.villageId;
      if (query.boothId) responseWhere.household.boothId = query.boothId;
    }

    const [sentimentGroups, responses, members] = await Promise.all([
      this.prisma.d2DSurveyResponse.groupBy({
        by: ['sentiment'],
        _count: true,
        where: { ...responseWhere, sentiment: { not: null } },
      }),
      this.prisma.d2DSurveyResponse.findMany({
        where: responseWhere,
        select: { issues: true, household: { select: { boothId: true, mandalId: true, villageId: true } } },
      }),
      this.prisma.d2DFamilyMember.findMany({
        where: {
          household: {
            ...(query.mandalId ? { mandalId: query.mandalId } : {}),
            ...(query.villageId ? { villageId: query.villageId } : {}),
            ...(query.boothId ? { boothId: query.boothId } : {}),
            responses: query.surveyId ? { some: { surveyId: query.surveyId } } : undefined,
          },
        },
        select: { age: true, gender: true, votingPreference: true, issues: true, education: true },
      }),
    ]);

    const sentiment: Record<string, number> = {};
    for (const s of sentimentGroups) {
      if (s.sentiment) sentiment[s.sentiment] = s._count;
    }
    const total = Object.values(sentiment).reduce((a, b) => a + b, 0) || 1;

    const boothMap: Record<string, { supporter: number; neutral: number; opponent: number; total: number }> = {};
    const mandalMap: Record<string, number> = {};
    const villageIssues: Record<string, Record<string, number>> = {};
    const issueTotals: Record<string, number> = {};

    for (const r of responses) {
      const boothId = r.household?.boothId ?? 'unknown';
      const mandalId = r.household?.mandalId ?? 'unknown';
      const villageId = r.household?.villageId ?? 'unknown';
      if (!boothMap[boothId]) boothMap[boothId] = { supporter: 0, neutral: 0, opponent: 0, total: 0 };
      boothMap[boothId].total++;
      mandalMap[mandalId] = (mandalMap[mandalId] ?? 0) + 1;

      const issues = Array.isArray(r.issues) ? (r.issues as string[]) : [];
      if (!villageIssues[villageId]) villageIssues[villageId] = {};
      for (const issue of issues) {
        villageIssues[villageId][issue] = (villageIssues[villageId][issue] ?? 0) + 1;
        issueTotals[issue] = (issueTotals[issue] ?? 0) + 1;
      }
    }

    const women = members.filter((m) => m.gender === 'Female');
    const youth = members.filter((m) => m.age && m.age >= 18 && m.age <= 35);
    const seniors = members.filter((m) => m.age && m.age >= 60);

    const prefCount = (list: typeof members) => {
      const c: Record<string, number> = {};
      for (const m of list) {
        if (m.votingPreference) c[m.votingPreference] = (c[m.votingPreference] ?? 0) + 1;
      }
      return c;
    };

    const schemeGaps: Record<string, number> = {};
    for (const m of members) {
      const issues = Array.isArray(m.issues) ? (m.issues as string[]) : [];
      for (const i of issues) {
        if (['Pension', 'Ration', 'HouseSite'].includes(i)) {
          schemeGaps[i] = (schemeGaps[i] ?? 0) + 1;
        }
      }
    }

    const ratingAnswers = await this.prisma.d2DResponseAnswer.findMany({
      where: {
        question: { type: 'Rating' },
        response: responseWhere,
      },
      select: { value: true },
      take: 200,
    });
    let leaderScore = 0;
    let leaderCount = 0;
    for (const a of ratingAnswers) {
      const v = Number(a.value);
      if (!Number.isNaN(v)) {
        leaderScore += v;
        leaderCount++;
      }
    }

    return {
      sentiment,
      supporterPct: Math.round(((sentiment['Supporter'] ?? 0) / total) * 100),
      neutralPct: Math.round(((sentiment['Neutral'] ?? 0) / total) * 100),
      opponentPct: Math.round(((sentiment['Opponent'] ?? 0) / total) * 100),
      boothAnalytics: Object.entries(boothMap).map(([boothId, v]) => ({ boothId, ...v })),
      mandalSentiment: Object.entries(mandalMap).map(([mandalId, count]) => ({ mandalId, responses: count })),
      villageIssues: Object.entries(villageIssues).map(([villageId, issues]) => ({
        villageId,
        issues: Object.entries(issues)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([issue, count]) => ({ issue, count })),
      })),
      topComplaints: Object.entries(issueTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([issue, count]) => ({ issue, count })),
      demographicFeedback: {
        women: prefCount(women),
        youth: prefCount(youth),
        seniors: prefCount(seniors),
      },
      schemeGaps,
      leaderPopularityScore: leaderCount ? Math.round((leaderScore / leaderCount) * 20) : 0,
      candidateFeedbackScore: leaderCount ? Number((leaderScore / leaderCount).toFixed(1)) : 0,
      totalResponses: responses.length,
    };
  }
}
