import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable()
export class CommitteeAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      mandalCommittee,
      villageCommittee,
      coordinationCommittee,
      mandalCoordinationCommittee,
      committeeTotal,
      committeeActive,
      observers,
      observersActive,
      impLeaders,
      impLeadersActive,
      influencers,
      influencersActive,
      press,
      pressActive,
    ] = await Promise.all([
      this.prisma.committeeMember.count({ where: { category: 'MandalCommittee' } }),
      this.prisma.committeeMember.count({ where: { category: 'VillageCommittee' } }),
      this.prisma.committeeMember.count({ where: { category: 'CoordinationCommittee' } }),
      this.prisma.committeeMember.count({ where: { category: 'MandalCoordinationCommittee' } }),
      this.prisma.committeeMember.count(),
      this.prisma.committeeMember.count({ where: { status: 'Active' } }),
      this.prisma.observer.count(),
      this.prisma.observer.count({ where: { status: 'Active' } }),
      this.prisma.impLeader.count(),
      this.prisma.impLeader.count({ where: { status: 'Active' } }),
      this.prisma.influencer.count(),
      this.prisma.influencer.count({ where: { status: 'Active' } }),
      this.prisma.pressContact.count(),
      this.prisma.pressContact.count({ where: { status: 'Active' } }),
    ]);

    const totalNetwork = committeeTotal + observers + impLeaders + influencers + press;
    const totalActive = committeeActive + observersActive + impLeadersActive + influencersActive + pressActive;

    return {
      totals: {
        mandalCommittee,
        villageCommittee,
        coordinationCommittee,
        mandalCoordinationCommittee,
        committeeMembers: committeeTotal,
        observers,
        impLeaders,
        influencers,
        press,
        totalNetwork,
      },
      activeVsInactive: {
        active: totalActive,
        inactive: totalNetwork - totalActive,
      },
      byCategory: [
        { category: 'Mandal Committee', count: mandalCommittee },
        { category: 'Village Committee', count: villageCommittee },
        { category: 'Coordination Committee', count: coordinationCommittee },
        { category: 'Mandal Coordination Committee', count: mandalCoordinationCommittee },
        { category: 'Observers', count: observers },
        { category: 'IMP Leaders', count: impLeaders },
        { category: 'Influencers', count: influencers },
        { category: 'Press', count: press },
      ],
      mandalStrength: await this.mandalStrength(),
      villageCoverage: await this.villageCoverage(),
      influenceScore: await this.influenceScore(),
    };
  }

  /** Mandal-wise network strength across committee members + observers + IMP leaders. */
  private async mandalStrength() {
    const mandals = await this.prisma.mandal.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            committeeMembers: true,
            observers: true,
            impLeaders: true,
            influencers: true,
            pressContacts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return mandals.map((m) => ({
      mandal: m.name,
      committeeMembers: m._count.committeeMembers,
      observers: m._count.observers,
      impLeaders: m._count.impLeaders,
      influencers: m._count.influencers,
      press: m._count.pressContacts,
      total:
        m._count.committeeMembers +
        m._count.observers +
        m._count.impLeaders +
        m._count.influencers +
        m._count.pressContacts,
    }));
  }

  /** Village-wise committee coverage. */
  private async villageCoverage() {
    const villages = await this.prisma.village.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { committeeMembers: true, committees: true } },
      },
      orderBy: { name: 'asc' },
    });
    return villages
      .map((v) => ({
        village: v.name,
        members: v._count.committeeMembers,
        committees: v._count.committees,
        covered: v._count.committeeMembers > 0,
      }))
      .sort((a, b) => b.members - a.members);
  }

  /** Influence-score analytics: averaged influence indicators by group. */
  private async influenceScore() {
    const [impAgg, influencerAgg, memberAgg] = await Promise.all([
      this.prisma.impLeader.aggregate({
        _avg: { voterInfluenceScore: true, communityReach: true },
        _count: true,
      }),
      this.prisma.influencer.aggregate({
        _avg: { engagementRate: true },
        _sum: {
          instagramFollowers: true,
          facebookFollowers: true,
          youtubeSubscribers: true,
          twitterFollowers: true,
        },
        _count: true,
      }),
      this.prisma.committeeMember.aggregate({
        _avg: { taskCompletionScore: true, attendanceCount: true },
        _count: true,
      }),
    ]);

    return {
      impLeaders: {
        avgVoterInfluence: round(impAgg._avg.voterInfluenceScore),
        avgCommunityReach: round(impAgg._avg.communityReach),
        count: impAgg._count,
      },
      influencers: {
        avgEngagementRate: round(influencerAgg._avg.engagementRate),
        totalReach:
          (influencerAgg._sum.instagramFollowers ?? 0) +
          (influencerAgg._sum.facebookFollowers ?? 0) +
          (influencerAgg._sum.youtubeSubscribers ?? 0) +
          (influencerAgg._sum.twitterFollowers ?? 0),
        count: influencerAgg._count,
      },
      committeeMembers: {
        avgTaskScore: round(memberAgg._avg.taskCompletionScore),
        avgAttendance: round(memberAgg._avg.attendanceCount),
        count: memberAgg._count,
      },
    };
  }
}

function round(v: number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Math.round(v * 10) / 10;
}
