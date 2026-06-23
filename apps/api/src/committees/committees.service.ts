import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import {
  CommitteeQueryDto,
  CreateCommitteeDto,
  UpdateCommitteeDto,
} from './dto/network.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */
const committeeInclude = {
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  _count: { select: { members: true } },
};

@Injectable()
export class CommitteesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CommitteeQueryDto) {
    const { page, limit, search, status, category, mandalId } = query;
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (mandalId) where.mandalId = mandalId;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.committee.findMany({
        where,
        include: committeeInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.committee.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async options() {
    return this.prisma.committee.findMany({
      select: { id: true, name: true, category: true },
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const committee = await this.prisma.committee.findUnique({
      where: { id },
      include: {
        ...committeeInclude,
        members: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            committeeRole: true,
            status: true,
          },
          orderBy: { fullName: 'asc' },
          take: 100,
        },
      },
    });
    if (!committee) throw new NotFoundException('Committee not found');
    return committee;
  }

  async create(dto: CreateCommitteeDto) {
    return this.prisma.committee.create({ data: { ...dto }, include: committeeInclude });
  }

  async update(id: string, dto: UpdateCommitteeDto) {
    await this.ensureExists(id);
    return this.prisma.committee.update({ where: { id }, data: { ...dto }, include: committeeInclude });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.committeeMember.updateMany({ where: { committeeId: id }, data: { committeeId: null } });
    await this.prisma.committee.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.committee.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Committee not found');
  }
}
