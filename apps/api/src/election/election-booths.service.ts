import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { ElectionCommonService } from './election-common.service';
import {
  BoothQueryDto,
  CreateBoothPlanDto,
  PollingAgentDto,
  UpdateBoothPlanDto,
} from './dto/election.dto';

const boothInclude = {
  booth: {
    select: {
      id: true,
      number: true,
      name: true,
      voterCount: true,
      village: {
        select: {
          id: true,
          name: true,
          mandal: { select: { id: true, name: true } },
        },
      },
    },
  },
  pollingAgents: {
    include: {
      cadre: { select: { id: true, name: true, mobile: true } },
      citizen: { select: { id: true, name: true, mobile: true } },
    },
  },
  _count: { select: { pollingDayUpdates: true } },
} satisfies Prisma.ElectionBoothPlanInclude;

@Injectable()
export class ElectionBoothsService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async list(query: BoothQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const { page, limit, search } = query;
    const where: Prisma.ElectionBoothPlanWhereInput = { electionId };
    if (query.strength) where.strength = query.strength;
    if (query.mandalId || query.villageId || search) {
      const boothWhere: Prisma.BoothWhereInput = {};
      if (query.mandalId || query.villageId) {
        boothWhere.village = {
          ...(query.mandalId ? { mandalId: query.mandalId } : {}),
          ...(query.villageId ? { id: query.villageId } : {}),
        };
      }
      if (search) {
        boothWhere.OR = [
          { number: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }
      where.booth = boothWhere;
    }
    const [data, total] = await Promise.all([
      this.prisma.electionBoothPlan.findMany({
        where,
        include: boothInclude,
        orderBy: { readinessScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionBoothPlan.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.electionBoothPlan.findUnique({ where: { id }, include: boothInclude });
    if (!row) throw new NotFoundException('Booth plan not found');
    return row;
  }

  async create(dto: CreateBoothPlanDto) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    const booth = await this.prisma.booth.findUnique({ where: { id: dto.boothId } });
    return this.prisma.electionBoothPlan.create({
      data: {
        electionId,
        boothId: dto.boothId,
        strength: dto.strength,
        readinessScore: dto.readinessScore ?? 0,
        voterCount: dto.voterCount ?? booth?.voterCount ?? 0,
        issues: dto.issues,
        committeeNotes: dto.committeeNotes,
        campaignStatus: dto.campaignStatus,
      },
      include: boothInclude,
    });
  }

  async update(id: string, dto: UpdateBoothPlanDto) {
    await this.get(id);
    return this.prisma.electionBoothPlan.update({
      where: { id },
      data: {
        strength: dto.strength,
        readinessScore: dto.readinessScore,
        voterCount: dto.voterCount,
        issues: dto.issues,
        committeeNotes: dto.committeeNotes,
        campaignStatus: dto.campaignStatus,
      },
      include: boothInclude,
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.electionBoothPlan.delete({ where: { id } });
    return { ok: true };
  }

  async addAgent(boothPlanId: string, dto: PollingAgentDto) {
    await this.get(boothPlanId);
    return this.prisma.electionPollingAgent.create({
      data: {
        boothPlanId,
        cadreId: dto.cadreId,
        citizenId: dto.citizenId,
        name: dto.name,
        mobile: dto.mobile,
        role: dto.role,
        status: dto.status,
      },
      include: {
        cadre: { select: { id: true, name: true } },
        citizen: { select: { id: true, name: true } },
      },
    });
  }

  async removeAgent(agentId: string) {
    await this.prisma.electionPollingAgent.delete({ where: { id: agentId } });
    return { ok: true };
  }
}
