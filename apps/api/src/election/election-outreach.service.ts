import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ElectionCommonService } from './election-common.service';
import { CreateOutreachDto, OutreachQueryDto, UpdateOutreachDto } from './dto/election.dto';

const outreachInclude = {
  citizen: { select: { id: true, name: true, mobile: true, voterId: true } },
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ElectionVoterOutreachInclude;

@Injectable()
export class ElectionOutreachService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async list(query: OutreachQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const { page, limit, search } = query;
    const where: Prisma.ElectionVoterOutreachWhereInput = { electionId };
    if (query.channel) where.channel = query.channel;
    if (query.stance) where.stance = query.stance;
    if (query.followUpRequired !== undefined) where.followUpRequired = query.followUpRequired;
    if (query.isKeyVoter !== undefined) where.isKeyVoter = query.isKeyVoter;
    if (query.mandalId) where.mandalId = query.mandalId;
    if (query.boothId) where.boothId = query.boothId;
    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactMobile: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.electionVoterOutreach.findMany({
        where,
        include: outreachInclude,
        orderBy: { outreachDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionVoterOutreach.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.electionVoterOutreach.findUnique({ where: { id }, include: outreachInclude });
    if (!row) throw new NotFoundException('Outreach record not found');
    return row;
  }

  async create(dto: CreateOutreachDto, user: AuthenticatedUser) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    return this.prisma.electionVoterOutreach.create({
      data: {
        electionId,
        citizenId: dto.citizenId,
        contactName: dto.contactName,
        contactMobile: dto.contactMobile,
        channel: dto.channel,
        stance: dto.stance,
        followUpRequired: dto.followUpRequired,
        isKeyVoter: dto.isKeyVoter,
        isInfluencer: dto.isInfluencer,
        notes: dto.notes,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        createdById: user.id,
      },
      include: outreachInclude,
    });
  }

  async update(id: string, dto: UpdateOutreachDto) {
    await this.get(id);
    return this.prisma.electionVoterOutreach.update({
      where: { id },
      data: {
        citizenId: dto.citizenId,
        contactName: dto.contactName,
        contactMobile: dto.contactMobile,
        channel: dto.channel,
        stance: dto.stance,
        followUpRequired: dto.followUpRequired,
        isKeyVoter: dto.isKeyVoter,
        isInfluencer: dto.isInfluencer,
        notes: dto.notes,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
      },
      include: outreachInclude,
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.electionVoterOutreach.delete({ where: { id } });
    return { ok: true };
  }

  async stats(query: OutreachQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const [byChannel, byStance, followUps, keyVoters] = await Promise.all([
      this.prisma.electionVoterOutreach.groupBy({
        by: ['channel'],
        where: { electionId },
        _count: { _all: true },
      }),
      this.prisma.electionVoterOutreach.groupBy({
        by: ['stance'],
        where: { electionId },
        _count: { _all: true },
      }),
      this.prisma.electionVoterOutreach.count({ where: { electionId, followUpRequired: true } }),
      this.prisma.electionVoterOutreach.count({ where: { electionId, isKeyVoter: true } }),
    ]);
    return { byChannel, byStance, followUps, keyVoters };
  }
}
