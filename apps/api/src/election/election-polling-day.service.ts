import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { NotificationType, PollingDayStatus } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ElectionCommonService } from './election-common.service';
import { CreatePollingUpdateDto, PollingDayQueryDto } from './dto/election.dto';

@Injectable()
export class ElectionPollingDayService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async liveDashboard(query: PollingDayQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const [boothPlans, byStatus, recentUpdates, issueCount] = await Promise.all([
      this.prisma.electionBoothPlan.findMany({
        where: { electionId },
        include: {
          booth: {
            select: {
              id: true,
              number: true,
              name: true,
              village: { select: { name: true, mandal: { select: { name: true } } } },
            },
          },
          pollingDayUpdates: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.electionPollingDayUpdate.groupBy({
        by: ['status'],
        where: { electionId },
        _count: { _all: true },
      }),
      this.prisma.electionPollingDayUpdate.findMany({
        where: { electionId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          boothPlan: { include: { booth: { select: { number: true, name: true } } } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.electionPollingDayUpdate.count({
        where: { electionId, status: PollingDayStatus.IssueReported, resolved: false },
      }),
    ]);

    const totalTurnout = recentUpdates.reduce((s, u) => Math.max(s, u.turnoutCount), 0);
    const boothsWithUpdates = boothPlans.filter((b) => b.pollingDayUpdates.length > 0).length;

    return {
      boothPlans: boothPlans.map((p) => ({
        id: p.id,
        boothId: p.boothId,
        boothNumber: p.booth.number,
        boothName: p.booth.name,
        mandalName: p.booth.village.mandal.name,
        readinessScore: p.readinessScore,
        latestUpdate: p.pollingDayUpdates[0] ?? null,
      })),
      byStatus,
      recentUpdates,
      issueCount,
      stats: {
        totalBooths: boothPlans.length,
        boothsReporting: boothsWithUpdates,
        openIssues: issueCount,
        latestTurnout: totalTurnout,
      },
    };
  }

  async listUpdates(query: PollingDayQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const where: Prisma.ElectionPollingDayUpdateWhereInput = { electionId };
    if (query.boothPlanId) where.boothPlanId = query.boothPlanId;
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.electionPollingDayUpdate.findMany({
        where,
        include: {
          boothPlan: { include: { booth: { select: { number: true, name: true } } } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.electionPollingDayUpdate.count({ where }),
    ]);
    return { data, meta: paginate(query.page, query.limit, total) };
  }

  async createUpdate(dto: CreatePollingUpdateDto, user: AuthenticatedUser) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    const boothPlan = await this.prisma.electionBoothPlan.findUnique({ where: { id: dto.boothPlanId } });
    if (!boothPlan || boothPlan.electionId !== electionId) {
      throw new NotFoundException('Booth plan not found for this election');
    }

    const update = await this.prisma.electionPollingDayUpdate.create({
      data: {
        electionId,
        boothPlanId: dto.boothPlanId,
        status: dto.status,
        turnoutCount: dto.turnoutCount ?? 0,
        hour: dto.hour,
        issueText: dto.issueText,
        resolved: dto.resolved ?? false,
        notes: dto.notes,
        createdById: user.id,
      },
      include: {
        boothPlan: { include: { booth: { select: { number: true, name: true } } } },
      },
    });

    if (dto.status === PollingDayStatus.IssueReported && dto.issueText) {
      const leaders = await this.prisma.user.findMany({
        where: { role: { name: { in: ['ConstituencyIncharge', 'MandalCoordinator', 'SuperAdmin'] } } },
        select: { id: true },
        take: 10,
      });
      for (const leader of leaders) {
        await this.common.notify(
          leader.id,
          NotificationType.Alert,
          `Polling issue - Booth ${update.boothPlan.booth.number}`,
          dto.issueText,
          '/election/polling-day',
        );
      }
    }

    return update;
  }

  async resolveIssue(updateId: string, user: AuthenticatedUser) {
    const update = await this.prisma.electionPollingDayUpdate.findUnique({ where: { id: updateId } });
    if (!update) throw new NotFoundException('Update not found');
    return this.prisma.electionPollingDayUpdate.update({
      where: { id: updateId },
      data: { resolved: true, status: PollingDayStatus.Resolved },
    });
  }
}
