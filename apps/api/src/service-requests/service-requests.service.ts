import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { GrievanceSlaService } from '../grievances/grievance-sla.service';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import {
  ChangeServiceRequestStatusDto,
  CreateServiceRequestDto,
  ForwardServiceRequestDto,
  PublicServiceRequestDto,
  ServiceRequestQueryDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';

const listInclude = {
  citizen: { select: { id: true, name: true, mobile: true } },
  village: { select: { id: true, name: true } },
  department: { select: { id: true, name: true, slaHours: true } },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.ServiceRequestInclude;

const detailInclude = {
  ...listInclude,
  updates: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.ServiceRequestInclude;

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    private prisma: PrismaService,
    private sla: GrievanceSlaService,
    private dispatch: NotificationDispatchService,
  ) {}

  // ----------------------------------------------------------
  // Queue
  // ----------------------------------------------------------
  async list(query: ServiceRequestQueryDto, user?: AuthenticatedUser) {
    const { page, limit, search, status, type, villageId, mandalId, departmentId, scope } = query;
    const where: Prisma.ServiceRequestWhereInput = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (villageId) where.villageId = villageId;
    if (departmentId) where.departmentId = departmentId;
    if (mandalId) where.village = { mandalId };
    if (scope === 'me' && user) where.assignedToId = user.id;

    if (search) {
      const term = { contains: search, mode: 'insensitive' as const };
      where.OR = [
        { refNo: term },
        { applicantName: term },
        { mobile: term },
        { details: term },
        { village: { name: term } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    const now = new Date();
    return {
      data: data.map((row) => ({
        ...row,
        daysRemaining: this.sla.computeDaysRemaining(row.slaDueAt, now),
        daysOverdue: this.sla.computeOverdueDays(row.slaDueAt, now),
        slaStatus: this.sla.computeSlaStatus(row.slaDueAt, now),
      })),
      meta: paginate(page, limit, total),
    };
  }

  async get(id: string) {
    const item = await this.prisma.serviceRequest.findUnique({ where: { id }, include: detailInclude });
    if (!item) throw new NotFoundException('Service request not found');
    return item;
  }

  // ----------------------------------------------------------
  // CRUD
  // ----------------------------------------------------------
  async create(dto: CreateServiceRequestDto, user: AuthenticatedUser) {
    const refNo = await this.nextRefNo();
    const slaDueAt = dto.departmentId ? await this.departmentDueAt(dto.departmentId) : null;

    return this.prisma.serviceRequest.create({
      data: {
        ...dto,
        refNo,
        status: dto.departmentId ? 'Forwarded' : 'Received',
        slaDueAt,
        updates: {
          create: {
            status: dto.departmentId ? 'Forwarded' : 'Received',
            notes: 'Request logged',
            createdBy: user.name,
          },
        },
      },
      include: detailInclude,
    });
  }

  async update(id: string, dto: UpdateServiceRequestDto) {
    await this.get(id);
    return this.prisma.serviceRequest.update({ where: { id }, data: dto, include: detailInclude });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.serviceRequest.delete({ where: { id } });
    return { ok: true };
  }

  // ----------------------------------------------------------
  // Transitions
  // ----------------------------------------------------------
  async changeStatus(id: string, dto: ChangeServiceRequestStatusDto, user: AuthenticatedUser) {
    const existing = await this.get(id);

    const request = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        outcome: dto.outcome ?? existing.outcome,
        updates: {
          create: { status: dto.status, notes: dto.notes, createdBy: user.name },
        },
      },
      include: detailInclude,
    });

    if (dto.status === 'Completed') await this.notifyApplicant(request, user.id);
    return request;
  }

  /** Forward to a department; the department's slaHours sets the due date (same rule as grievances). */
  async forward(id: string, dto: ForwardServiceRequestDto, user: AuthenticatedUser) {
    await this.get(id);
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true, name: true, slaHours: true },
    });
    if (!department) throw new NotFoundException('Department not found');

    const { slaDueAt } = await this.sla.resolveResolutionSla({ departmentId: department.id });

    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        departmentId: department.id,
        status: 'Forwarded',
        slaDueAt,
        updates: {
          create: {
            status: 'Forwarded',
            notes: dto.notes ?? `Forwarded to ${department.name} (SLA ${department.slaHours}h)`,
            createdBy: user.name,
          },
        },
      },
      include: detailInclude,
    });
  }

  // ----------------------------------------------------------
  // Stats
  // ----------------------------------------------------------
  async stats() {
    const now = new Date();
    const [byStatus, byType, byVillage, overdue, total] = await Promise.all([
      this.prisma.serviceRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.serviceRequest.groupBy({ by: ['type'], _count: { _all: true } }),
      this.prisma.serviceRequest.groupBy({
        by: ['villageId'],
        _count: { _all: true },
        where: { villageId: { not: null } },
      }),
      this.prisma.serviceRequest.count({
        where: { status: { notIn: ['Completed', 'Rejected'] }, slaDueAt: { lt: now } },
      }),
      this.prisma.serviceRequest.count(),
    ]);

    const villageIds = byVillage.map((v) => v.villageId!).filter(Boolean);
    const villages = villageIds.length
      ? await this.prisma.village.findMany({ where: { id: { in: villageIds } }, select: { id: true, name: true } })
      : [];

    return {
      total,
      overdue,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count._all])),
      byVillage: byVillage.map((v) => ({
        villageId: v.villageId,
        name: villages.find((x) => x.id === v.villageId)?.name ?? 'Unknown',
        count: v._count._all,
      })),
    };
  }

  /** Departments + villages for the forward/intake pickers, behind the ServiceDesk permission. */
  async options() {
    const [departments, villages] = await Promise.all([
      this.prisma.department.findMany({ select: { id: true, name: true, slaHours: true }, orderBy: { name: 'asc' } }),
      this.prisma.village.findMany({
        select: { id: true, name: true, mandal: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
        take: 1000,
      }),
    ]);
    return { departments, villages };
  }

  // ----------------------------------------------------------
  // Public intake + tracking
  // ----------------------------------------------------------
  async publicSubmit(dto: PublicServiceRequestDto) {
    const session = await this.prisma.publicCitizenSession.findFirst({
      where: { id: dto.sessionId, mobile: dto.mobile, verified: true },
    });
    if (!session) throw new UnauthorizedException('Verify your mobile number with an OTP first');

    const refNo = await this.nextRefNo();
    const request = await this.prisma.serviceRequest.create({
      data: {
        refNo,
        applicantName: dto.applicantName,
        mobile: dto.mobile,
        type: dto.type,
        details: dto.details,
        villageId: dto.villageId,
        status: 'Received',
        updates: { create: { status: 'Received', notes: 'Submitted via public portal', createdBy: dto.applicantName } },
      },
      select: { id: true, refNo: true, type: true, status: true, createdAt: true },
    });
    return request;
  }

  async publicTrack(refNo: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { refNo: { equals: refNo, mode: 'insensitive' } },
      select: {
        refNo: true,
        applicantName: true,
        type: true,
        status: true,
        outcome: true,
        slaDueAt: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { name: true } },
        village: { select: { name: true } },
        updates: { orderBy: { createdAt: 'desc' }, select: { status: true, notes: true, createdAt: true } },
      },
    });
    if (!request) throw new NotFoundException('Service request not found');
    return request;
  }

  // ----------------------------------------------------------
  // My Village public feed
  // ----------------------------------------------------------
  async villageFeed(villageId: string) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { id: true, name: true, mandal: { select: { id: true, name: true } } },
    });
    if (!village) throw new NotFoundException('Village not found');

    const now = new Date();
    const [promiseUpdates, projects, events] = await Promise.all([
      this.prisma.promisePublicUpdate.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          note: true,
          createdAt: true,
          promise: { select: { id: true, title: true, workStatus: true, completionPct: true } },
        },
      }),
      this.prisma.developmentProject.findMany({
        where: { villageId },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          progressPct: true,
          budget: true,
          spent: true,
          expectedEndDate: true,
        },
      }),
      this.prisma.event.findMany({
        where: { villageId, startAt: { gte: now }, status: { in: ['Scheduled', 'Ongoing'] } },
        orderBy: { startAt: 'asc' },
        take: 10,
        select: { id: true, title: true, type: true, startAt: true, venue: true },
      }),
    ]);

    return {
      village,
      promiseUpdates,
      projects,
      events,
      // These two models may not exist yet (owned by other feature branches) — the feed
      // degrades to an empty list instead of 500ing.
      serviceCamps: await this.optionalModel('serviceCamp', {
        where: { villageId, startAt: { gte: now } },
        orderBy: { startAt: 'asc' },
        take: 10,
      }),
      fundWorks: await this.optionalModel('fundWork', {
        where: { villageId, status: 'Sanctioned' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    };
  }

  /** findMany on a model that may not be in the generated client yet. */
  private async optionalModel(model: string, args: Record<string, unknown>): Promise<unknown[]> {
    const delegate = (this.prisma as unknown as Record<string, { findMany?: (a: unknown) => Promise<unknown[]> }>)[model];
    if (!delegate?.findMany) return [];
    try {
      return await delegate.findMany(args);
    } catch (err) {
      this.logger.warn(`village feed: ${model} unavailable — ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  private async notifyApplicant(
    request: { refNo: string; mobile: string; type: string; outcome: string | null },
    userId: string,
  ) {
    const body = [
      `Your ${request.type} request ${request.refNo} is complete.`,
      request.outcome ? `Outcome: ${request.outcome}` : null,
    ]
      .filter(Boolean)
      .join(' ');
    try {
      await this.dispatch.dispatch({
        userId,
        type: 'Success',
        title: `Service request ${request.refNo} completed`,
        body,
        channels: ['sms', 'whatsapp'],
        smsTo: request.mobile,
        whatsappTo: request.mobile,
      });
    } catch (err) {
      this.logger.warn(`Completion notice failed for ${request.refNo}: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async departmentDueAt(departmentId: string) {
    const { slaDueAt } = await this.sla.resolveResolutionSla({ departmentId });
    return slaDueAt;
  }

  private async nextRefNo() {
    const prefix = `SR-${new Date().getFullYear()}-`;
    const rows = await this.prisma.serviceRequest.findMany({
      where: { refNo: { startsWith: prefix } },
      select: { refNo: true },
    });
    let max = 0;
    for (const { refNo } of rows) {
      const num = parseInt(refNo.slice(prefix.length), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }
}
