import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { ElectionCommonService } from './election-common.service';
import { CreateTeamDto, TeamMemberDto, TeamQueryDto, UpdateTeamDto } from './dto/election.dto';

const teamInclude = {
  leaderCadre: { select: { id: true, name: true, mobile: true, designation: true } },
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  members: {
    include: { cadre: { select: { id: true, name: true, mobile: true, designation: true } } },
  },
  _count: { select: { assignments: true } },
} satisfies Prisma.ElectionCampaignTeamInclude;

@Injectable()
export class ElectionTeamsService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async list(query: TeamQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const { page, limit, search } = query;
    const where: Prisma.ElectionCampaignTeamWhereInput = { electionId };
    if (query.type) where.type = query.type;
    if (query.mandalId) where.mandalId = query.mandalId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.electionCampaignTeam.findMany({
        where,
        include: teamInclude,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionCampaignTeam.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.electionCampaignTeam.findUnique({ where: { id }, include: teamInclude });
    if (!row) throw new NotFoundException('Team not found');
    return row;
  }

  async create(dto: CreateTeamDto) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    return this.prisma.electionCampaignTeam.create({
      data: {
        electionId,
        name: dto.name,
        type: dto.type,
        leaderCadreId: dto.leaderCadreId,
        description: dto.description,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
      },
      include: teamInclude,
    });
  }

  async update(id: string, dto: UpdateTeamDto) {
    await this.get(id);
    return this.prisma.electionCampaignTeam.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        leaderCadreId: dto.leaderCadreId,
        description: dto.description,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
      },
      include: teamInclude,
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.electionCampaignTeam.delete({ where: { id } });
    return { ok: true };
  }

  async addMember(teamId: string, dto: TeamMemberDto) {
    await this.get(teamId);
    return this.prisma.electionTeamMember.create({
      data: { teamId, cadreId: dto.cadreId, role: dto.role },
      include: { cadre: { select: { id: true, name: true } } },
    });
  }

  async removeMember(memberId: string) {
    await this.prisma.electionTeamMember.delete({ where: { id: memberId } });
    return { ok: true };
  }
}
