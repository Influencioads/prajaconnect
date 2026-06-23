import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityStatus, AppointmentStatus, Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import {
  AppointmentCalendarQueryDto,
  CreateAppointmentDto,
  CreateScheduleBlockDto,
  ScheduleQueryDto,
  UpdateAppointmentDto,
  UpdateScheduleBlockDto,
} from './dto/leader-office.dto';

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@Injectable()
export class LeaderOfficeService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pendingAppointments,
      todayAppointments,
      visitorsToday,
      activeVisitors,
      upcomingSchedule,
      recentAppointments,
    ] = await Promise.all([
      this.prisma.appointmentRequest.count({ where: { status: AppointmentStatus.Pending } }),
      this.prisma.appointmentRequest.count({
        where: {
          scheduledAt: { gte: today, lt: tomorrow },
          status: { in: [AppointmentStatus.Approved, AppointmentStatus.Pending] },
        },
      }),
      this.prisma.visitor.count({ where: { checkInAt: { gte: today } } }),
      this.prisma.visitor.count({ where: { checkOutAt: null } }),
      this.prisma.leaderScheduleBlock.findMany({
        where: { startAt: { gte: today } },
        take: 10,
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.appointmentRequest.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      pendingAppointments,
      todayAppointments,
      visitorsToday,
      activeVisitors,
      upcomingSchedule,
      recentAppointments,
    };
  }

  async listAppointments(query: PaginationDto, status?: string) {
    const { page, limit, search } = query;
    const where: Prisma.AppointmentRequestWhereInput = {};
    if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      where.status = status as AppointmentStatus;
    }
    if (search) {
      where.OR = [
        { visitorName: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.appointmentRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointmentRequest.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getAppointment(id: string) {
    const appt = await this.prisma.appointmentRequest.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async createAppointment(body: CreateAppointmentDto) {
    return this.prisma.appointmentRequest.create({
      data: {
        visitorName: body.visitorName,
        mobile: body.mobile,
        purpose: body.purpose,
        scheduledAt: toDate(body.scheduledAt),
      },
    });
  }

  async updateAppointment(id: string, body: UpdateAppointmentDto) {
    await this.getAppointment(id);
    return this.prisma.appointmentRequest.update({
      where: { id },
      data: {
        visitorName: body.visitorName,
        mobile: body.mobile,
        purpose: body.purpose,
        status: body.status,
        scheduledAt: body.scheduledAt !== undefined ? toDate(body.scheduledAt) : undefined,
      },
    });
  }

  async deleteAppointment(id: string) {
    await this.getAppointment(id);
    return this.prisma.appointmentRequest.delete({ where: { id } });
  }

  async listVisitors(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { mobile: { contains: search, mode: 'insensitive' as const } },
            { purpose: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.visitor.findMany({
        where,
        orderBy: { checkInAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.visitor.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async exportVisitorsCsv() {
    const rows = await this.prisma.visitor.findMany({ orderBy: { checkInAt: 'desc' }, take: 5000 });
    const header = 'Name,Mobile,Purpose,CheckIn,CheckOut';
    const lines = rows.map((r) =>
      [r.name, r.mobile ?? '', r.purpose ?? '', r.checkInAt.toISOString(), r.checkOutAt?.toISOString() ?? '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...lines].join('\n');
  }

  async checkInVisitor(body: { name: string; mobile?: string; purpose?: string }) {
    return this.prisma.visitor.create({ data: body });
  }

  async checkOutVisitor(id: string) {
    await this.ensureVisitor(id);
    return this.prisma.visitor.update({
      where: { id },
      data: { checkOutAt: new Date() },
    });
  }

  async listSchedule(query: ScheduleQueryDto = {}) {
    const from = toDate(query.from);
    const to = toDate(query.to);
    const where: Prisma.LeaderScheduleBlockWhereInput = {};
    if (from && to) {
      where.startAt = { lte: to };
      where.endAt = { gte: from };
    } else if (from) {
      where.endAt = { gte: from };
    } else if (to) {
      where.startAt = { lte: to };
    }
    return this.prisma.leaderScheduleBlock.findMany({
      where,
      orderBy: { startAt: 'asc' },
      take: 500,
    });
  }

  async calendar(query: AppointmentCalendarQueryDto) {
    const now = new Date();
    const from = toDate(query.from) ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toDate(query.to) ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const apptWhere: Prisma.AppointmentRequestWhereInput = {
      scheduledAt: { gte: from, lte: to },
    };
    if (query.status) {
      apptWhere.status = query.status;
    }

    const [appointments, blocks] = await Promise.all([
      this.prisma.appointmentRequest.findMany({
        where: apptWhere,
        select: { id: true, visitorName: true, purpose: true, status: true, scheduledAt: true },
        orderBy: { scheduledAt: 'asc' },
        take: 500,
      }),
      this.prisma.leaderScheduleBlock.findMany({
        where: { startAt: { lte: to }, endAt: { gte: from } },
        select: { id: true, title: true, startAt: true, endAt: true },
        orderBy: { startAt: 'asc' },
        take: 500,
      }),
    ]);

    const items = [
      ...appointments
        .filter((a) => a.scheduledAt)
        .map((a) => ({
          id: a.id,
          kind: 'appointment' as const,
          title: `${a.visitorName} — ${a.purpose}`,
          status: a.status,
          startAt: a.scheduledAt!.toISOString(),
          endAt: undefined,
          date: a.scheduledAt!.toISOString(),
        })),
      ...blocks.map((b) => ({
        id: b.id,
        kind: 'schedule' as const,
        title: b.title,
        status: undefined,
        startAt: b.startAt.toISOString(),
        endAt: b.endAt.toISOString(),
        date: b.startAt.toISOString(),
      })),
    ].sort((a, b) => a.startAt.localeCompare(b.startAt));

    return { from: from.toISOString(), to: to.toISOString(), items };
  }

  async createScheduleBlock(body: CreateScheduleBlockDto) {
    return this.prisma.leaderScheduleBlock.create({
      data: { title: body.title, startAt: new Date(body.startAt), endAt: new Date(body.endAt) },
    });
  }

  async updateScheduleBlock(id: string, body: UpdateScheduleBlockDto) {
    await this.ensureScheduleBlock(id);
    return this.prisma.leaderScheduleBlock.update({
      where: { id },
      data: {
        title: body.title,
        startAt: body.startAt ? new Date(body.startAt) : undefined,
        endAt: body.endAt ? new Date(body.endAt) : undefined,
      },
    });
  }

  async deleteScheduleBlock(id: string) {
    await this.ensureScheduleBlock(id);
    return this.prisma.leaderScheduleBlock.delete({ where: { id } });
  }

  async listVipContacts(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { organization: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.vipContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.vipContact.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createVipContact(body: { name: string; mobile?: string; organization?: string; notes?: string }) {
    return this.prisma.vipContact.create({ data: body });
  }

  async updateVipContact(id: string, body: { name?: string; mobile?: string; organization?: string; notes?: string }) {
    await this.ensureVipContact(id);
    return this.prisma.vipContact.update({ where: { id }, data: body });
  }

  async deleteVipContact(id: string) {
    await this.ensureVipContact(id);
    return this.prisma.vipContact.delete({ where: { id } });
  }

  async listTasks(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.leaderPersonalTask.findMany({
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.leaderPersonalTask.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createTask(body: { title: string; dueDate?: string; status?: ActivityStatus }) {
    return this.prisma.leaderPersonalTask.create({
      data: {
        title: body.title,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        status: body.status,
      },
    });
  }

  async updateTask(id: string, body: { title?: string; dueDate?: string; status?: ActivityStatus }) {
    await this.ensureTask(id);
    return this.prisma.leaderPersonalTask.update({
      where: { id },
      data: {
        title: body.title,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        status: body.status,
      },
    });
  }

  async deleteTask(id: string) {
    await this.ensureTask(id);
    return this.prisma.leaderPersonalTask.delete({ where: { id } });
  }

  async listNotes(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.meetingNote.findMany({
        orderBy: { meetingDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.meetingNote.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createNote(body: { title: string; content: string; meetingDate?: string }) {
    return this.prisma.meetingNote.create({
      data: {
        title: body.title,
        content: body.content,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : undefined,
      },
    });
  }

  async updateNote(id: string, body: { title?: string; content?: string; meetingDate?: string }) {
    await this.ensureNote(id);
    return this.prisma.meetingNote.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : undefined,
      },
    });
  }

  async deleteNote(id: string) {
    await this.ensureNote(id);
    return this.prisma.meetingNote.delete({ where: { id } });
  }

  async listStaffAssignments() {
    return this.prisma.officeStaffAssignment.findMany({
      include: { user: { select: { id: true, name: true, email: true, designation: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaffAssignment(body: { userId: string; role?: string }) {
    return this.prisma.officeStaffAssignment.create({
      data: { userId: body.userId, role: body.role ?? 'Staff' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateStaffAssignment(id: string, body: { role?: string }) {
    await this.ensureStaffAssignment(id);
    return this.prisma.officeStaffAssignment.update({
      where: { id },
      data: body,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async deleteStaffAssignment(id: string) {
    await this.ensureStaffAssignment(id);
    return this.prisma.officeStaffAssignment.delete({ where: { id } });
  }

  private async ensureVisitor(id: string) {
    const found = await this.prisma.visitor.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Visitor not found');
  }

  private async ensureScheduleBlock(id: string) {
    const found = await this.prisma.leaderScheduleBlock.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Schedule block not found');
  }

  private async ensureVipContact(id: string) {
    const found = await this.prisma.vipContact.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('VIP contact not found');
  }

  private async ensureTask(id: string) {
    const found = await this.prisma.leaderPersonalTask.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Task not found');
  }

  private async ensureNote(id: string) {
    const found = await this.prisma.meetingNote.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Meeting note not found');
  }

  private async ensureStaffAssignment(id: string) {
    const found = await this.prisma.officeStaffAssignment.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Staff assignment not found');
  }
}
