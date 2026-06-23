import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PromiseWorkStatus } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { toCsv, fmtCsvDate } from '../common/utils/csv.util';

@Injectable()
export class ManifestoService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [statusCounts, avgCompletion, budgetAgg, categories, recentPromises] =
      await Promise.all([
        this.prisma.electionPromise.groupBy({
          by: ['workStatus'],
          _count: { _all: true },
        }),
        this.prisma.electionPromise.aggregate({ _avg: { completionPct: true } }),
        this.prisma.electionPromise.aggregate({
          _sum: { budgetTotal: true, budgetSpent: true },
        }),
        this.prisma.promiseCategory.findMany({
          include: { _count: { select: { promises: true } } },
        }),
        this.prisma.electionPromise.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: { category: { select: { id: true, name: true } } },
        }),
      ]);

    const byStatus = Object.fromEntries(
      statusCounts.map((s) => [s.workStatus, s._count._all]),
    );

    return {
      totalPromises: statusCounts.reduce((sum, s) => sum + s._count._all, 0),
      byStatus,
      avgCompletionPct: Math.round(avgCompletion._avg.completionPct ?? 0),
      budgetTotal: budgetAgg._sum.budgetTotal ?? 0,
      budgetSpent: budgetAgg._sum.budgetSpent ?? 0,
      categories,
      recentPromises,
    };
  }

  async listCategories(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.promiseCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { promises: true } } },
      }),
      this.prisma.promiseCategory.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createCategory(body: { name: string }) {
    return this.prisma.promiseCategory.create({ data: body });
  }

  async updateCategory(id: string, body: { name: string }) {
    const existing = await this.prisma.promiseCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    return this.prisma.promiseCategory.update({ where: { id }, data: body });
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.promiseCategory.findUnique({
      where: { id },
      include: { _count: { select: { promises: true } } },
    });
    if (!existing) throw new NotFoundException('Category not found');
    if (existing._count.promises > 0) {
      throw new BadRequestException('Cannot delete category with linked promises');
    }
    await this.prisma.promiseCategory.delete({ where: { id } });
    return { ok: true };
  }

  async listPromises(query: PaginationDto, workStatus?: string, categoryId?: string) {
    const { page, limit, search } = query;
    const where: {
      workStatus?: PromiseWorkStatus;
      categoryId?: string;
      title?: { contains: string; mode: 'insensitive' };
    } = {};
    if (workStatus) where.workStatus = workStatus as PromiseWorkStatus;
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.electionPromise.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { publicUpdates: true, statusLogs: true } },
        },
      }),
      this.prisma.electionPromise.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getPromise(id: string) {
    const promise = await this.prisma.electionPromise.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        publicUpdates: { orderBy: { createdAt: 'desc' } },
        statusLogs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!promise) throw new NotFoundException('Promise not found');
    return promise;
  }

  async createPromise(body: {
    title: string;
    categoryId?: string;
    department?: string;
    completionPct?: number;
    budgetTotal?: number;
    budgetSpent?: number;
    workStatus?: string;
  }) {
    const workStatus = (body.workStatus as PromiseWorkStatus) ?? PromiseWorkStatus.NotStarted;

    return this.prisma.electionPromise.create({
      data: {
        title: body.title,
        categoryId: body.categoryId,
        department: body.department,
        completionPct: body.completionPct ?? 0,
        budgetTotal: body.budgetTotal ?? 0,
        budgetSpent: body.budgetSpent ?? 0,
        workStatus,
        statusLogs: { create: { status: workStatus } },
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async updatePromise(
    id: string,
    body: {
      title?: string;
      categoryId?: string;
      department?: string;
      completionPct?: number;
      budgetTotal?: number;
      budgetSpent?: number;
      workStatus?: string;
    },
  ) {
    const existing = await this.prisma.electionPromise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promise not found');

    const workStatus = body.workStatus as PromiseWorkStatus | undefined;

    const promise = await this.prisma.electionPromise.update({
      where: { id },
      data: {
        title: body.title,
        categoryId: body.categoryId,
        department: body.department,
        completionPct: body.completionPct,
        budgetTotal: body.budgetTotal,
        budgetSpent: body.budgetSpent,
        workStatus,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    if (workStatus && workStatus !== existing.workStatus) {
      await this.prisma.promiseWorkStatusLog.create({
        data: { promiseId: id, status: workStatus },
      });
    }

    return promise;
  }

  async listPublicUpdates(query: PaginationDto, promiseId?: string) {
    const { page, limit } = query;
    const where = promiseId ? { promiseId } : {};

    const [data, total] = await Promise.all([
      this.prisma.promisePublicUpdate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { promise: { select: { id: true, title: true } } },
      }),
      this.prisma.promisePublicUpdate.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createPublicUpdate(body: { promiseId: string; note: string; isPublic?: boolean }) {
    return this.prisma.promisePublicUpdate.create({
      data: {
        promiseId: body.promiseId,
        note: body.note,
        isPublic: body.isPublic ?? true,
      },
      include: { promise: { select: { id: true, title: true } } },
    });
  }

  async updatePublicUpdate(
    id: string,
    body: { note?: string; isPublic?: boolean },
  ) {
    const existing = await this.prisma.promisePublicUpdate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Public update not found');
    return this.prisma.promisePublicUpdate.update({ where: { id }, data: body });
  }

  async deletePublicUpdate(id: string) {
    const existing = await this.prisma.promisePublicUpdate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Public update not found');
    await this.prisma.promisePublicUpdate.delete({ where: { id } });
    return { ok: true };
  }

  async departmentMatrix() {
    const promises = await this.prisma.electionPromise.findMany({
      select: {
        department: true,
        workStatus: true,
        completionPct: true,
        budgetTotal: true,
        budgetSpent: true,
      },
    });

    const matrix = new Map<
      string,
      {
        department: string;
        total: number;
        notStarted: number;
        inProgress: number;
        completed: number;
        delayed: number;
        avgCompletion: number;
        budgetTotal: number;
        budgetSpent: number;
      }
    >();

    for (const p of promises) {
      const dept = p.department ?? 'Unassigned';
      const row = matrix.get(dept) ?? {
        department: dept,
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        delayed: 0,
        avgCompletion: 0,
        budgetTotal: 0,
        budgetSpent: 0,
      };
      row.total += 1;
      row.budgetTotal += p.budgetTotal;
      row.budgetSpent += p.budgetSpent;
      row.avgCompletion += p.completionPct;
      if (p.workStatus === PromiseWorkStatus.NotStarted) row.notStarted += 1;
      else if (p.workStatus === PromiseWorkStatus.InProgress) row.inProgress += 1;
      else if (p.workStatus === PromiseWorkStatus.Completed) row.completed += 1;
      else if (p.workStatus === PromiseWorkStatus.Delayed) row.delayed += 1;
      matrix.set(dept, row);
    }

    return Array.from(matrix.values()).map((r) => ({
      ...r,
      avgCompletion: r.total ? Math.round(r.avgCompletion / r.total) : 0,
    }));
  }

  async exportCsv(type: string) {
    if (type === 'promises') {
      const rows = await this.prisma.electionPromise.findMany({
        take: 5000,
        orderBy: { updatedAt: 'desc' },
        include: { category: { select: { name: true } } },
      });
      return toCsv(rows, [
        { header: 'title', value: (r) => r.title },
        { header: 'category', value: (r) => r.category?.name },
        { header: 'department', value: (r) => r.department },
        { header: 'workStatus', value: (r) => r.workStatus },
        { header: 'completionPct', value: (r) => r.completionPct },
        { header: 'budgetTotal', value: (r) => r.budgetTotal },
        { header: 'budgetSpent', value: (r) => r.budgetSpent },
        { header: 'updatedAt', value: (r) => fmtCsvDate(r.updatedAt) },
      ]);
    }
    if (type === 'departments') {
      const rows = await this.departmentMatrix();
      return toCsv(rows, [
        { header: 'department', value: (r) => r.department },
        { header: 'total', value: (r) => r.total },
        { header: 'completed', value: (r) => r.completed },
        { header: 'inProgress', value: (r) => r.inProgress },
        { header: 'delayed', value: (r) => r.delayed },
        { header: 'avgCompletion', value: (r) => r.avgCompletion },
        { header: 'budgetTotal', value: (r) => r.budgetTotal },
        { header: 'budgetSpent', value: (r) => r.budgetSpent },
      ]);
    }
    throw new BadRequestException(`Unsupported export type: ${type}`);
  }
}
