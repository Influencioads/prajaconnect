import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { NotificationType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ElectionCommonService } from './election-common.service';
import { AssignWorkDto, CreateWorkDto, UpdateWorkDto, WorkQueryDto } from './dto/election.dto';

const workInclude = {
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  assignments: {
    include: {
      cadre: { select: { id: true, name: true, mobile: true, designation: true } },
      team: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ElectionCampaignWorkInclude;

@Injectable()
export class ElectionWorksService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async list(query: WorkQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const { page, limit, search } = query;
    const where: Prisma.ElectionCampaignWorkWhereInput = { electionId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.mandalId) where.mandalId = query.mandalId;
    if (query.villageId) where.villageId = query.villageId;
    if (query.boothId) where.boothId = query.boothId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.electionCampaignWork.findMany({
        where,
        include: workInclude,
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionCampaignWork.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.electionCampaignWork.findUnique({ where: { id }, include: workInclude });
    if (!row) throw new NotFoundException('Campaign work not found');
    return row;
  }

  async create(dto: CreateWorkDto, user: AuthenticatedUser) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    return this.prisma.electionCampaignWork.create({
      data: {
        electionId,
        title: dto.title,
        type: dto.type,
        status: dto.status,
        priority: dto.priority,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        description: dto.description,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        photoUrls: dto.photoUrls,
        proofUrl: dto.proofUrl,
        eventId: dto.eventId,
        activityId: dto.activityId,
        createdById: user.id,
      },
      include: workInclude,
    });
  }

  async update(id: string, dto: UpdateWorkDto) {
    await this.get(id);
    return this.prisma.electionCampaignWork.update({
      where: { id },
      data: {
        title: dto.title,
        type: dto.type,
        status: dto.status,
        priority: dto.priority,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        description: dto.description,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        photoUrls: dto.photoUrls,
        proofUrl: dto.proofUrl,
        eventId: dto.eventId,
        activityId: dto.activityId,
      },
      include: workInclude,
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.electionCampaignWork.delete({ where: { id } });
    return { ok: true };
  }

  async assign(id: string, dto: AssignWorkDto, user: AuthenticatedUser) {
    await this.get(id);
    const assignment = await this.prisma.electionWorkAssignment.create({
      data: {
        workId: id,
        cadreId: dto.cadreId,
        teamId: dto.teamId,
        role: dto.role,
        status: dto.status,
      },
      include: { cadre: { select: { id: true, name: true, userId: true } } },
    });
    if (dto.cadreId) {
      await this.common.notifyCadreUser(
        dto.cadreId,
        NotificationType.Info,
        'Campaign work assigned',
        'You have been assigned a new campaign work item.',
        '/election/works',
      );
    }
    return assignment;
  }

  async myWorks(cadreId: string | undefined, user: AuthenticatedUser, query: WorkQueryDto) {
    const cadre = cadreId
      ? await this.prisma.cadre.findUnique({ where: { id: cadreId } })
      : await this.prisma.cadre.findFirst({ where: { userId: user.id } });
    if (!cadre) return { data: [], meta: paginate(1, query.limit, 0) };
    const electionId = await this.common.resolveElectionId(query.electionId);
    const where: Prisma.ElectionCampaignWorkWhereInput = {
      electionId,
      assignments: { some: { cadreId: cadre.id } },
    };
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.electionCampaignWork.findMany({
        where,
        include: workInclude,
        orderBy: { deadline: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.electionCampaignWork.count({ where }),
    ]);
    return { data, meta: paginate(query.page, query.limit, total) };
  }
}
