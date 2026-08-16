import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './dto/project.dto';
import { CreateProgressDto } from './dto/progress.dto';

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

  // ---------- geotagged works progress ----------

  async listProgress(projectId: string) {
    await this.ensureExists(projectId);
    return this.prisma.workProgressUpdate.findMany({
      where: { projectId },
      include: { reportedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Record a milestone update; project progressPct becomes the max of its milestones. */
  async addProgress(projectId: string, dto: CreateProgressDto, reportedById: string, photoUrl?: string) {
    await this.ensureExists(projectId);
    const update = await this.prisma.workProgressUpdate.create({
      data: {
        projectId,
        milestone: dto.milestone,
        percentComplete: dto.percentComplete,
        photoUrl: photoUrl ?? dto.photoUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
        reportedById,
      },
      include: { reportedBy: { select: { id: true, name: true } } },
    });

    const max = await this.prisma.workProgressUpdate.aggregate({
      where: { projectId },
      _max: { percentComplete: true },
    });
    const progressPct = max._max.percentComplete ?? dto.percentComplete;
    const data: Prisma.DevelopmentProjectUpdateInput = { progressPct };
    if (progressPct >= 100) {
      data.status = 'Completed';
      data.completedAt = new Date();
    }
    await this.prisma.developmentProject.update({ where: { id: projectId }, data });

    return update;
  }

  /** GIS-style points: latest geotagged progress update per project. */
  async progressMap() {
    const updates = await this.prisma.workProgressUpdate.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      include: {
        project: {
          select: { id: true, name: true, status: true, progressPct: true, mandal: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const seen = new Set<string>();
    const points: Array<{
      projectId: string; name: string; status: string; progressPct: number; mandal: string | null;
      milestone: string; percentComplete: number; photoUrl: string | null; lat: number; lng: number; reportedAt: Date;
    }> = [];
    for (const u of updates) {
      if (seen.has(u.projectId)) continue;
      seen.add(u.projectId);
      points.push({
        projectId: u.projectId,
        name: u.project.name,
        status: u.project.status,
        progressPct: u.project.progressPct,
        mandal: u.project.mandal?.name ?? null,
        milestone: u.milestone,
        percentComplete: u.percentComplete,
        photoUrl: u.photoUrl,
        lat: u.latitude!,
        lng: u.longitude!,
        reportedAt: u.createdAt,
      });
    }
    return points;
  }
}
