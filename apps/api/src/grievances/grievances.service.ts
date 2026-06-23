import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { GrievanceStatus } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import {
  AddNoteDto,
  AssignGrievanceDto,
  ChangeStatusDto,
  CreateGrievanceDto,
  FeedbackDto,
  GrievanceQueryDto,
  UpdateGrievanceDto,
} from './dto/grievance.dto';
import { GrievanceSlaService } from './grievance-sla.service';

const RESOLVED_STATES: GrievanceStatus[] = [GrievanceStatus.Resolved, GrievanceStatus.Closed];

const listInclude = {
  citizen: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  assignedOfficial: { select: { id: true, name: true } },
  assignedCadre: { select: { id: true, name: true } },
  mandal: { select: { id: true, name: true } },
} satisfies Prisma.GrievanceInclude;

@Injectable()
export class GrievancesService {
  constructor(
    private prisma: PrismaService,
    private sla: GrievanceSlaService,
  ) {}

  async list(query: GrievanceQueryDto) {
    const { page, limit, search, status, priority, departmentId, assignedOfficialId, mandalId, category } = query;
    const where: Prisma.GrievanceWhereInput = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (departmentId) where.departmentId = departmentId;
    if (assignedOfficialId) where.assignedOfficialId = assignedOfficialId;
    if (mandalId) where.mandalId = mandalId;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.grievance.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.grievance.count({ where }),
    ]);

    const now = new Date();
    return {
      data: data.map((row) => this.sla.enrichGrievanceRow(row, now)),
      meta: paginate(page, limit, total),
    };
  }

  async stats() {
    const grouped = await this.prisma.grievance.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const byStatus: Record<string, number> = {};
    for (const g of grouped) byStatus[g.status] = g._count._all;

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const open = (byStatus.Open ?? 0) + (byStatus.Assigned ?? 0) + (byStatus.InProgress ?? 0) + (byStatus.Escalated ?? 0);
    const resolved = (byStatus.Resolved ?? 0) + (byStatus.Closed ?? 0);

    const overdue = await this.prisma.grievance.count({
      where: {
        status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] },
        slaDueAt: { lt: new Date() },
      },
    });

    const { validationBreached, resolutionBreached } = await this.sla.violationStats();

    return { total, open, resolved, overdue, validationBreached, resolutionBreached, byStatus };
  }

  async get(id: string) {
    const grievance = await this.prisma.grievance.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, mobile: true } },
        department: { select: { id: true, name: true, slaHours: true } },
        assignedOfficial: { select: { id: true, name: true, designation: true, mobile: true } },
        assignedCadre: { select: { id: true, name: true, designation: true } },
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!grievance) throw new NotFoundException('Grievance not found');
    const now = new Date();
    return this.sla.enrichGrievanceRow(grievance, now);
  }

  async create(dto: CreateGrievanceDto, user: AuthenticatedUser) {
    const code = await this.nextCode();
    const { slaDays, slaDueAt } = await this.sla.resolveResolutionSla({
      slaDays: dto.slaDays,
      departmentId: dto.departmentId,
      priority: dto.priority,
    });
    const seriousness = this.sla.seriousnessFromDays(slaDays);

    const grievance = await this.prisma.grievance.create({
      data: {
        ...dto,
        code,
        status: dto.departmentId ? 'Assigned' : 'Open',
        slaDays,
        slaDueAt,
        createdById: user.id,
        updates: {
          create: {
            action: 'Created',
            toStatus: dto.departmentId ? 'Assigned' : 'Open',
            note: `Grievance logged — ${seriousness.label} (${slaDays} day SLA)`,
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
      include: listInclude,
    });
    return grievance;
  }

  async update(id: string, dto: UpdateGrievanceDto) {
    await this.ensureExists(id);
    const { slaDays, ...rest } = dto;
    const data: Prisma.GrievanceUpdateInput = { ...rest };

    if (slaDays) {
      data.slaDays = slaDays;
      data.slaDueAt = this.sla.computeSlaDueFromDays(slaDays);
      await this.sla.resolveResolutionViolation(id);
    }

    return this.prisma.grievance.update({ where: { id }, data, include: listInclude });
  }

  async assign(id: string, dto: AssignGrievanceDto, user: AuthenticatedUser) {
    const grievance = await this.get(id);

    const deptChanged = dto.departmentId && dto.departmentId !== grievance.departmentId;
    let slaDays = grievance.slaDays ?? undefined;
    let slaDueAt = grievance.slaDueAt ?? undefined;

    if (dto.slaDays || deptChanged) {
      const resolved = await this.sla.resolveResolutionSla({
        slaDays: dto.slaDays ?? (deptChanged ? undefined : slaDays),
        departmentId: dto.departmentId ?? grievance.departmentId,
        priority: grievance.priority,
      });
      slaDays = resolved.slaDays;
      slaDueAt = resolved.slaDueAt;
      if (deptChanged || dto.slaDays) {
        await this.sla.resolveResolutionViolation(id);
      }
    }

    const nextStatus =
      grievance.status === 'Open' ? GrievanceStatus.Assigned : (grievance.status as GrievanceStatus);

    const parts: string[] = [];
    if (dto.departmentId) parts.push('department');
    if (dto.assignedOfficialId) parts.push('official');
    if (dto.assignedCadreId) parts.push('cadre');

    return this.prisma.grievance.update({
      where: { id },
      data: {
        departmentId: dto.departmentId ?? grievance.departmentId,
        assignedOfficialId: dto.assignedOfficialId ?? grievance.assignedOfficialId,
        assignedCadreId: dto.assignedCadreId ?? grievance.assignedCadreId,
        slaDays,
        slaDueAt,
        status: nextStatus,
        updates: {
          create: {
            action: 'Assigned',
            fromStatus: grievance.status,
            toStatus: nextStatus,
            note: dto.note ?? `Assigned ${parts.join(', ') || 'handlers'}${slaDays ? ` — ${slaDays} day SLA` : ''}`,
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
      include: listInclude,
    });
  }

  async changeStatus(id: string, dto: ChangeStatusDto, user: AuthenticatedUser) {
    const grievance = await this.get(id);
    const becomingResolved =
      RESOLVED_STATES.includes(dto.status) && !RESOLVED_STATES.includes(grievance.status as GrievanceStatus);

    const updated = await this.prisma.grievance.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: becomingResolved ? new Date() : grievance.resolvedAt,
        updates: {
          create: {
            action: dto.status === 'Escalated' ? 'Escalate' : 'StatusChange',
            fromStatus: grievance.status,
            toStatus: dto.status,
            note: dto.note,
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
      include: listInclude,
    });

    if (becomingResolved) {
      await this.sla.resolveResolutionViolation(id);
    }

    return updated;
  }

  async addNote(id: string, dto: AddNoteDto, user: AuthenticatedUser) {
    await this.ensureExists(id);
    await this.prisma.grievanceUpdate.create({
      data: {
        grievanceId: id,
        action: 'Note',
        note: dto.note,
        byUserId: user.id,
        byName: user.name,
      },
    });
    return this.get(id);
  }

  async feedback(id: string, dto: FeedbackDto, user: AuthenticatedUser) {
    await this.ensureExists(id);
    return this.prisma.grievance.update({
      where: { id },
      data: {
        satisfactionRating: dto.rating,
        feedback: dto.feedback,
        updates: {
          create: {
            action: 'Feedback',
            note: `Citizen rated ${dto.rating}/5${dto.feedback ? ` — ${dto.feedback}` : ''}`,
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
      include: listInclude,
    });
  }

  async options() {
    const [departments, officials, cadres] = await Promise.all([
      this.prisma.department.findMany({
        select: { id: true, name: true, slaHours: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.governmentOfficial.findMany({
        select: { id: true, name: true, designation: true, departmentId: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.cadre.findMany({
        where: { status: 'Active' },
        select: { id: true, name: true, designation: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { departments, officials, cadres };
  }

  private async nextCode() {
    const codes = await this.prisma.grievance.findMany({ select: { code: true } });
    let max = 999;
    for (const { code } of codes) {
      const num = parseInt(code.replace(/\D/g, ''), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }
    return `GRV-${max + 1}`;
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.grievance.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Grievance not found');
  }
}
