import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './dto/project.dto';

const listInclude = {
  mandal: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.DevelopmentProjectInclude;

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async list(query: ProjectQueryDto) {
    const { page, limit, search, status, category, mandalId } = query;
    const where: Prisma.DevelopmentProjectWhereInput = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (mandalId) where.mandalId = mandalId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contractor: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.developmentProject.findMany({
        where,
        include: listInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.developmentProject.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const [grouped, agg] = await Promise.all([
      this.prisma.developmentProject.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.developmentProject.aggregate({
        _sum: { budget: true, spent: true },
        _avg: { progressPct: true },
        _count: { _all: true },
      }),
    ]);
    const byStatus: Record<string, number> = {};
    for (const g of grouped) byStatus[g.status] = g._count._all;
    return {
      total: agg._count._all,
      totalBudget: agg._sum.budget ?? 0,
      totalSpent: agg._sum.spent ?? 0,
      avgProgress: Math.round(agg._avg.progressPct ?? 0),
      byStatus,
    };
  }

  async get(id: string) {
    const project = await this.prisma.developmentProject.findUnique({
      where: { id },
      include: {
        mandal: { select: { id: true, name: true } },
        village: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(dto: CreateProjectDto) {
    const { startDate, expectedEndDate, ...rest } = dto;
    return this.prisma.developmentProject.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
      },
      include: listInclude,
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.ensureExists(id);
    const { startDate, expectedEndDate, ...rest } = dto;
    return this.prisma.developmentProject.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(expectedEndDate !== undefined
          ? { expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null }
          : {}),
        ...(rest.status === 'Completed' ? { completedAt: new Date(), progressPct: 100 } : {}),
      },
      include: listInclude,
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.developmentProject.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Project not found');
  }
}
