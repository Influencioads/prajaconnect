import { Injectable, Logger } from '@nestjs/common';
import {
  GrievanceSlaViolationStatus,
  GrievanceSlaViolationType,
  Prisma,
} from '@praja/database';
import { NotificationType, UserRole } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { SlaViolationQueryDto } from './dto/grievance-sla.dto';

const MS_PER_DAY = 86400000;
const REMINDER_OVERDUE_DAYS = 7;

const VALIDATION_ACTIVE_STATUSES = ['New', 'PendingValidation', 'MoreInfoRequired'] as const;
const RESOLUTION_ACTIVE_STATUSES = ['Open', 'Assigned', 'InProgress', 'Escalated'] as const;

const LEADER_ROLES: UserRole[] = [
  UserRole.SuperAdmin,
  UserRole.StateLeader,
  UserRole.DistrictLeader,
  UserRole.ConstituencyIncharge,
];

export type SlaStatus = 'OnTrack' | 'DueSoon' | 'Breached' | 'None';

@Injectable()
export class GrievanceSlaService {
  private readonly logger = new Logger(GrievanceSlaService.name);

  constructor(private prisma: PrismaService) {}

  computeOverdueDays(dueAt: Date | null | undefined, now = new Date()): number {
    if (!dueAt) return 0;
    if (dueAt >= now) return 0;
    return Math.max(1, Math.ceil((now.getTime() - dueAt.getTime()) / MS_PER_DAY));
  }

  computeDaysRemaining(dueAt: Date | null | undefined, now = new Date()): number | null {
    if (!dueAt) return null;
    if (dueAt <= now) return 0;
    return Math.ceil((dueAt.getTime() - now.getTime()) / MS_PER_DAY);
  }

  computeSlaStatus(dueAt: Date | null | undefined, now = new Date()): SlaStatus {
    if (!dueAt) return 'None';
    if (dueAt < now) return 'Breached';
    const hoursLeft = (dueAt.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (hoursLeft <= 24) return 'DueSoon';
    return 'OnTrack';
  }

  async validationSlaHours(): Promise<number> {
    const row = await this.prisma.setting.findUnique({
      where: { key: 'temp_grievance_validation_sla_hours' },
    });
    const hours = row ? parseInt(row.value, 10) : 48;
    return Number.isFinite(hours) && hours > 0 ? hours : 48;
  }

  async computeValidationDueAt(from = new Date()): Promise<Date> {
    const hours = await this.validationSlaHours();
    return new Date(from.getTime() + hours * 60 * 60 * 1000);
  }

  async isCronEnabled(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'grievance_sla_cron_enabled' } });
    if (!row) return true;
    return row.value !== 'false' && row.value !== '0';
  }

  priorityDefaultDays(priority?: string | null): number {
    switch (priority) {
      case 'High':
        return 1;
      case 'Low':
        return 7;
      default:
        return 3;
    }
  }

  seriousnessFromDays(days: number): { label: string; level: 'critical' | 'urgent' | 'standard' | 'routine' | 'low' } {
    if (days <= 1) return { label: 'Critical', level: 'critical' };
    if (days <= 3) return { label: 'Urgent', level: 'urgent' };
    if (days <= 7) return { label: 'Standard', level: 'standard' };
    if (days <= 14) return { label: 'Routine', level: 'routine' };
    return { label: 'Low urgency', level: 'low' };
  }

  computeSlaDueFromDays(days: number, from = new Date()): Date {
    return new Date(from.getTime() + days * MS_PER_DAY);
  }

  async resolveResolutionSla(input: {
    slaDays?: number;
    departmentId?: string | null;
    priority?: string | null;
    from?: Date;
  }): Promise<{ slaDays: number; slaDueAt: Date }> {
    const from = input.from ?? new Date();

    if (input.slaDays && input.slaDays > 0) {
      return { slaDays: input.slaDays, slaDueAt: this.computeSlaDueFromDays(input.slaDays, from) };
    }

    if (input.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: input.departmentId },
        select: { slaHours: true },
      });
      if (dept) {
        const days = Math.max(1, Math.ceil(dept.slaHours / 24));
        return { slaDays: days, slaDueAt: new Date(from.getTime() + dept.slaHours * 60 * 60 * 1000) };
      }
    }

    const days = this.priorityDefaultDays(input.priority);
    return { slaDays: days, slaDueAt: this.computeSlaDueFromDays(days, from) };
  }

  enrichGrievanceRow<T extends { slaDueAt?: Date | null; slaDays?: number | null; priority?: string }>(
    row: T,
    now = new Date(),
  ) {
    const days = row.slaDays ?? (row.slaDueAt ? this.computeDaysRemaining(row.slaDueAt, now) : null);
    return {
      ...row,
      daysRemaining: this.computeDaysRemaining(row.slaDueAt, now),
      daysOverdue: this.computeOverdueDays(row.slaDueAt, now),
      slaStatus: this.computeSlaStatus(row.slaDueAt, now),
      seriousness: row.slaDays ? this.seriousnessFromDays(row.slaDays) : undefined,
    };
  }

  enrichTempRow<T extends { validationDueAt?: Date | null }>(row: T, now = new Date()) {
    return {
      ...row,
      daysRemaining: this.computeDaysRemaining(row.validationDueAt, now),
      daysOverdue: this.computeOverdueDays(row.validationDueAt, now),
      slaStatus: this.computeSlaStatus(row.validationDueAt, now),
    };
  }

  async scanAll() {
    const [validationCreated, resolutionCreated] = await Promise.all([
      this.scanValidationViolations(),
      this.scanResolutionViolations(),
    ]);
    return { validationCreated, resolutionCreated };
  }

  async scanValidationViolations() {
    const now = new Date();
    const overdue = await this.prisma.temporaryGrievance.findMany({
      where: {
        validationStatus: { in: [...VALIDATION_ACTIVE_STATUSES] },
        validationDueAt: { lt: now },
      },
      select: {
        id: true,
        tempTicketId: true,
        issueSummary: true,
        validationDueAt: true,
        assignedValidatorId: true,
      },
    });

    let created = 0;
    for (const item of overdue) {
      const dueAt = item.validationDueAt!;
      const overdueDays = this.computeOverdueDays(dueAt, now);
      const result = await this.upsertViolation({
        type: GrievanceSlaViolationType.Validation,
        tempGrievanceId: item.id,
        slaDueAt: dueAt,
        overdueDays,
        dedupeKey: `validation-${item.id}`,
        title: `Validation SLA breached: ${item.tempTicketId}`,
        body: `${item.issueSummary ?? 'Temp grievance'} is ${overdueDays} day(s) overdue for validation.`,
        link: `/grievances/sla-tracker?type=Validation&highlight=${item.id}`,
        assigneeUserId: item.assignedValidatorId ?? undefined,
      });
      if (result.isNew) created += 1;
    }
    return created;
  }

  async scanResolutionViolations() {
    const now = new Date();
    const overdue = await this.prisma.grievance.findMany({
      where: {
        status: { in: [...RESOLUTION_ACTIVE_STATUSES] },
        slaDueAt: { lt: now },
      },
      select: {
        id: true,
        code: true,
        title: true,
        slaDueAt: true,
        assignedOfficialId: true,
        assignedCadreId: true,
        assignedCadre: { select: { userId: true } },
      },
    });

    let created = 0;
    for (const item of overdue) {
      const dueAt = item.slaDueAt!;
      const overdueDays = this.computeOverdueDays(dueAt, now);
      const assigneeUserId = item.assignedCadre?.userId ?? undefined;
      const result = await this.upsertViolation({
        type: GrievanceSlaViolationType.Resolution,
        grievanceId: item.id,
        slaDueAt: dueAt,
        overdueDays,
        dedupeKey: `resolution-${item.id}`,
        title: `Resolution SLA breached: ${item.code}`,
        body: `${item.title} is ${overdueDays} day(s) overdue for resolution.`,
        link: `/grievances/sla-tracker?type=Resolution&highlight=${item.id}`,
        assigneeUserId,
      });
      if (result.isNew) created += 1;
    }
    return created;
  }

  private async upsertViolation(input: {
    type: GrievanceSlaViolationType;
    grievanceId?: string;
    tempGrievanceId?: string;
    slaDueAt: Date;
    overdueDays: number;
    dedupeKey: string;
    title: string;
    body: string;
    link: string;
    assigneeUserId?: string;
  }) {
    const existing = await this.prisma.grievanceSlaViolation.findUnique({
      where: { dedupeKey: input.dedupeKey },
    });

    if (existing) {
      if (existing.status === GrievanceSlaViolationStatus.Resolved) {
        return { violation: existing, isNew: false };
      }

      const shouldRemind =
        input.overdueDays >= REMINDER_OVERDUE_DAYS &&
        input.overdueDays % REMINDER_OVERDUE_DAYS === 0 &&
        (!existing.lastNotifiedAt ||
          this.computeOverdueDays(existing.lastNotifiedAt, new Date()) >= REMINDER_OVERDUE_DAYS);

      const violation = await this.prisma.grievanceSlaViolation.update({
        where: { id: existing.id },
        data: { overdueDays: input.overdueDays, slaDueAt: input.slaDueAt },
      });

      if (shouldRemind) {
        await this.notifyStakeholders({
          title: `${input.title} (${input.overdueDays} days overdue)`,
          body: input.body,
          link: input.link,
          assigneeUserId: input.assigneeUserId,
        });
        await this.prisma.grievanceSlaViolation.update({
          where: { id: violation.id },
          data: { lastNotifiedAt: new Date() },
        });
      }

      return { violation, isNew: false };
    }

    const violation = await this.prisma.grievanceSlaViolation.create({
      data: {
        type: input.type,
        grievanceId: input.grievanceId,
        tempGrievanceId: input.tempGrievanceId,
        slaDueAt: input.slaDueAt,
        overdueDays: input.overdueDays,
        dedupeKey: input.dedupeKey,
        lastNotifiedAt: new Date(),
      },
    });

    await this.notifyStakeholders({
      title: input.title,
      body: input.body,
      link: input.link,
      assigneeUserId: input.assigneeUserId,
    });

    return { violation, isNew: true };
  }

  async resolveValidationViolation(tempGrievanceId: string) {
    await this.prisma.grievanceSlaViolation.updateMany({
      where: {
        tempGrievanceId,
        type: GrievanceSlaViolationType.Validation,
        status: GrievanceSlaViolationStatus.Open,
      },
      data: { status: GrievanceSlaViolationStatus.Resolved, resolvedAt: new Date() },
    });
  }

  async resolveResolutionViolation(grievanceId: string) {
    await this.prisma.grievanceSlaViolation.updateMany({
      where: {
        grievanceId,
        type: GrievanceSlaViolationType.Resolution,
        status: GrievanceSlaViolationStatus.Open,
      },
      data: { status: GrievanceSlaViolationStatus.Resolved, resolvedAt: new Date() },
    });
  }

  private async notifyStakeholders(input: {
    title: string;
    body: string;
    link: string;
    assigneeUserId?: string;
  }) {
    const leaders = await this.prisma.user.findMany({
      where: { role: { name: { in: LEADER_ROLES } }, status: 'Active' },
      select: { id: true },
      take: 50,
    });

    const userIds = new Set(leaders.map((u) => u.id));
    if (input.assigneeUserId) userIds.add(input.assigneeUserId);

    if (!userIds.size) return;

    await this.prisma.notification.createMany({
      data: [...userIds].map((userId) => ({
        userId,
        type: NotificationType.Alert,
        title: input.title,
        body: input.body,
        link: input.link,
      })),
    });
  }

  async trackerSummary() {
    const now = new Date();
    const openWhere = { status: GrievanceSlaViolationStatus.Open };

    const [
      openValidation,
      openResolution,
      avgOverdue,
      byDepartment,
      byMandal,
      liveValidationOverdue,
      liveResolutionOverdue,
    ] = await Promise.all([
      this.prisma.grievanceSlaViolation.count({
        where: { ...openWhere, type: GrievanceSlaViolationType.Validation },
      }),
      this.prisma.grievanceSlaViolation.count({
        where: { ...openWhere, type: GrievanceSlaViolationType.Resolution },
      }),
      this.prisma.grievanceSlaViolation.aggregate({
        where: openWhere,
        _avg: { overdueDays: true },
      }),
      this.prisma.grievanceSlaViolation.findMany({
        where: { ...openWhere, type: GrievanceSlaViolationType.Resolution, grievance: { departmentId: { not: null } } },
        select: { grievance: { select: { departmentId: true, department: { select: { id: true, name: true } } } } },
      }),
      this.prisma.grievanceSlaViolation.findMany({
        where: {
          ...openWhere,
          OR: [
            { grievance: { mandalId: { not: null } } },
            { tempGrievance: { mandalId: { not: null } } },
          ],
        },
        select: {
          grievance: { select: { mandalId: true, mandal: { select: { id: true, name: true } } } },
          tempGrievance: { select: { mandalId: true, mandal: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.temporaryGrievance.count({
        where: {
          validationStatus: { in: [...VALIDATION_ACTIVE_STATUSES] },
          validationDueAt: { lt: now },
        },
      }),
      this.prisma.grievance.count({
        where: {
          status: { in: [...RESOLUTION_ACTIVE_STATUSES] },
          slaDueAt: { lt: now },
        },
      }),
    ]);

    const deptMap = new Map<string, { departmentId: string; name: string; count: number }>();
    for (const row of byDepartment) {
      const dept = row.grievance?.department;
      if (!dept) continue;
      const prev = deptMap.get(dept.id);
      deptMap.set(dept.id, { departmentId: dept.id, name: dept.name, count: (prev?.count ?? 0) + 1 });
    }

    const mandalMap = new Map<string, { mandalId: string; name: string; count: number }>();
    for (const row of byMandal) {
      const mandal = row.grievance?.mandal ?? row.tempGrievance?.mandal;
      const mandalId = row.grievance?.mandalId ?? row.tempGrievance?.mandalId;
      if (!mandalId || !mandal) continue;
      const prev = mandalMap.get(mandalId);
      mandalMap.set(mandalId, { mandalId, name: mandal.name, count: (prev?.count ?? 0) + 1 });
    }

    return {
      openValidationViolations: openValidation,
      openResolutionViolations: openResolution,
      totalOpenViolations: openValidation + openResolution,
      avgOverdueDays: Math.round(avgOverdue._avg.overdueDays ?? 0),
      liveValidationOverdue,
      liveResolutionOverdue,
      byDepartment: [...deptMap.values()].sort((a, b) => b.count - a.count),
      byMandal: [...mandalMap.values()].sort((a, b) => b.count - a.count),
    };
  }

  async listViolations(query: SlaViolationQueryDto) {
    const { page, limit, type, status, departmentId, mandalId, minOverdueDays } = query;
    const where: Prisma.GrievanceSlaViolationWhereInput = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (minOverdueDays) where.overdueDays = { gte: minOverdueDays };

    if (departmentId || mandalId) {
      where.AND = [
        ...(departmentId
          ? [{ grievance: { departmentId } }]
          : []),
        ...(mandalId
          ? [{
              OR: [
                { grievance: { mandalId } },
                { tempGrievance: { mandalId } },
              ],
            }]
          : []),
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.grievanceSlaViolation.findMany({
        where,
        include: {
          grievance: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
              department: { select: { id: true, name: true } },
              mandal: { select: { id: true, name: true } },
              assignedOfficial: { select: { id: true, name: true } },
              assignedCadre: { select: { id: true, name: true } },
            },
          },
          tempGrievance: {
            select: {
              id: true,
              tempTicketId: true,
              issueSummary: true,
              validationStatus: true,
              mandal: { select: { id: true, name: true } },
              assignedValidator: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ overdueDays: 'desc' }, { breachedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.grievanceSlaViolation.count({ where }),
    ]);

    return { data: rows, meta: paginate(page, limit, total) };
  }

  async violationStats() {
    const openWhere = { status: GrievanceSlaViolationStatus.Open };
    const [validationBreached, resolutionBreached] = await Promise.all([
      this.prisma.grievanceSlaViolation.count({
        where: { ...openWhere, type: GrievanceSlaViolationType.Validation },
      }),
      this.prisma.grievanceSlaViolation.count({
        where: { ...openWhere, type: GrievanceSlaViolationType.Resolution },
      }),
    ]);
    return { validationBreached, resolutionBreached };
  }
}
