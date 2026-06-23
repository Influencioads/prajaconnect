import { Injectable, NotFoundException } from '@nestjs/common';
import { CallDirection } from '@praja/database';
import { TempGrievanceSource } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { TempGrievancesService } from '../temp-grievances/temp-grievances.service';

@Injectable()
export class CallCenterService {
  constructor(
    private prisma: PrismaService,
    private tempGrievances: TempGrievancesService,
  ) {}

  async dashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalCalls, inboundToday, outboundToday, agents, pendingFollowUps, recentCalls] =
      await Promise.all([
        this.prisma.callLog.count(),
        this.prisma.callLog.count({
          where: { direction: CallDirection.Inbound, createdAt: { gte: today } },
        }),
        this.prisma.callLog.count({
          where: { direction: CallDirection.Outbound, createdAt: { gte: today } },
        }),
        this.prisma.callAgent.findMany({
          include: { user: { select: { id: true, name: true } } },
        }),
        this.prisma.callFollowUpReminder.count({ where: { completed: false } }),
        this.prisma.callLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            agent: { include: { user: { select: { name: true } } } },
            queue: { select: { name: true } },
          },
        }),
      ]);
    return { totalCalls, inboundToday, outboundToday, agents, pendingFollowUps, recentCalls };
  }

  async listQueues() {
    return this.prisma.callQueue.findMany({
      include: { _count: { select: { callLogs: true } } },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  async createQueue(body: { name: string; priority?: number }) {
    return this.prisma.callQueue.create({
      data: { name: body.name, priority: body.priority ?? 0 },
    });
  }

  async updateQueue(id: string, body: { name?: string; priority?: number }) {
    return this.prisma.callQueue.update({ where: { id }, data: body });
  }

  async deleteQueue(id: string) {
    await this.prisma.callQueue.delete({ where: { id } });
    return { success: true };
  }

  async listCalls(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? {
          OR: [
            { callerNumber: { contains: search, mode: 'insensitive' as const } },
            { notes: { contains: search, mode: 'insensitive' as const } },
            { disposition: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.callLog.findMany({
        where,
        include: {
          agent: { include: { user: { select: { id: true, name: true } } } },
          queue: { select: { id: true, name: true } },
          followUps: { where: { completed: false }, take: 3 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.callLog.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getCall(id: string) {
    const call = await this.prisma.callLog.findUnique({
      where: { id },
      include: {
        agent: { include: { user: { select: { id: true, name: true, email: true } } } },
        queue: true,
        followUps: { orderBy: { dueAt: 'asc' } },
      },
    });
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  async createCall(body: {
    direction?: string;
    callerNumber?: string;
    disposition?: string;
    durationSec?: number;
    notes?: string;
    agentId?: string;
    queueId?: string;
  }) {
    return this.prisma.callLog.create({
      data: {
        direction: (body.direction as CallDirection) ?? CallDirection.Inbound,
        callerNumber: body.callerNumber,
        disposition: body.disposition,
        durationSec: body.durationSec ?? 0,
        notes: body.notes,
        agentId: body.agentId,
        queueId: body.queueId,
      },
      include: {
        agent: { include: { user: { select: { name: true } } } },
        queue: { select: { name: true } },
      },
    });
  }

  async updateCall(
    id: string,
    body: {
      direction?: string;
      callerNumber?: string;
      disposition?: string;
      durationSec?: number;
      notes?: string;
      agentId?: string;
      queueId?: string;
    },
  ) {
    await this.getCall(id);
    return this.prisma.callLog.update({
      where: { id },
      data: {
        ...(body.direction !== undefined ? { direction: body.direction as CallDirection } : {}),
        ...(body.callerNumber !== undefined ? { callerNumber: body.callerNumber } : {}),
        ...(body.disposition !== undefined ? { disposition: body.disposition } : {}),
        ...(body.durationSec !== undefined ? { durationSec: body.durationSec } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.agentId !== undefined ? { agentId: body.agentId } : {}),
        ...(body.queueId !== undefined ? { queueId: body.queueId } : {}),
      },
      include: {
        agent: { include: { user: { select: { name: true } } } },
        queue: { select: { name: true } },
      },
    });
  }

  async createTempGrievanceFromCall(id: string, user: AuthenticatedUser, body?: { notes?: string }) {
    const call = await this.getCall(id);
    if (call.tempGrievanceId) {
      return { tempGrievanceId: call.tempGrievanceId, existing: true };
    }
    const temp = await this.tempGrievances.create(
      {
        source: TempGrievanceSource.Call,
        sourceReferenceId: call.id,
        mobileNumber: call.callerNumber ?? undefined,
        issueDescription: body?.notes ?? call.notes ?? 'Call center grievance intake',
        issueSummary: call.disposition ?? 'Helpline call',
      },
      user,
    );
    await this.prisma.callLog.update({
      where: { id },
      data: { tempGrievanceId: temp.id },
    });
    return { tempGrievanceId: temp.id, tempGrievance: temp };
  }

  async listFollowUps(query: PaginationDto, completed?: boolean) {
    const { page, limit } = query;
    const where = completed !== undefined ? { completed } : {};
    const [data, total] = await Promise.all([
      this.prisma.callFollowUpReminder.findMany({
        where,
        include: {
          callLog: {
            select: {
              id: true,
              callerNumber: true,
              disposition: true,
              agent: { include: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { dueAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.callFollowUpReminder.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createFollowUp(body: { callLogId: string; dueAt: string }) {
    return this.prisma.callFollowUpReminder.create({
      data: { callLogId: body.callLogId, dueAt: new Date(body.dueAt) },
      include: { callLog: { select: { callerNumber: true, disposition: true } } },
    });
  }

  async updateFollowUp(id: string, body: { dueAt?: string; completed?: boolean }) {
    return this.prisma.callFollowUpReminder.update({
      where: { id },
      data: {
        ...(body.dueAt !== undefined ? { dueAt: new Date(body.dueAt) } : {}),
        ...(body.completed !== undefined ? { completed: body.completed } : {}),
      },
    });
  }

  async deleteFollowUp(id: string) {
    await this.prisma.callFollowUpReminder.delete({ where: { id } });
    return { success: true };
  }

  async listAgents() {
    return this.prisma.callAgent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { callLogs: true } },
      },
      orderBy: { status: 'asc' },
    });
  }

  async listScripts() {
    return this.prisma.callScript.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createScript(body: { title: string; content: string }) {
    return this.prisma.callScript.create({ data: body });
  }

  async agentPerformance() {
    const agents = await this.prisma.callAgent.findMany({
      include: {
        user: { select: { id: true, name: true } },
        callLogs: { select: { durationSec: true, disposition: true, direction: true } },
      },
    });
    return agents.map((a) => {
      const calls = a.callLogs;
      const avgDuration =
        calls.length > 0 ? Math.round(calls.reduce((s, c) => s + c.durationSec, 0) / calls.length) : 0;
      const dispositions = calls.reduce<Record<string, number>>((acc, c) => {
        const key = c.disposition ?? 'Unknown';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
      return {
        agentId: a.id,
        name: a.user.name,
        status: a.status,
        totalCalls: calls.length,
        avgDurationSec: avgDuration,
        dispositions,
      };
    });
  }

  async dispositionReport() {
    const rows = await this.prisma.callLog.groupBy({
      by: ['disposition'],
      _count: { _all: true },
      _avg: { durationSec: true },
    });
    return rows.map((r) => ({
      disposition: r.disposition ?? 'Unknown',
      count: r._count._all,
      avgDurationSec: Math.round(r._avg.durationSec ?? 0),
    }));
  }

  async exportCsv(type: string) {
    if (type === 'calls') {
      const rows = await this.prisma.callLog.findMany({
        include: { agent: { include: { user: { select: { name: true } } } }, queue: true },
        take: 5000,
        orderBy: { createdAt: 'desc' },
      });
      const header = 'callerNumber,direction,disposition,durationSec,agent,queue,createdAt';
      return [
        header,
        ...rows.map(
          (r) =>
            `"${r.callerNumber ?? ''}","${r.direction}","${r.disposition ?? ''}",${r.durationSec},"${r.agent?.user.name ?? ''}","${r.queue?.name ?? ''}",${r.createdAt.toISOString()}`,
        ),
      ].join('\n');
    }
    if (type === 'agent-performance') {
      const perf = await this.agentPerformance();
      const header = 'agent,status,totalCalls,avgDurationSec';
      return [
        header,
        ...perf.map((p) => `"${p.name}","${p.status}",${p.totalCalls},${p.avgDurationSec}`),
      ].join('\n');
    }
    if (type === 'disposition') {
      const rows = await this.dispositionReport();
      const header = 'disposition,count,avgDurationSec';
      return [header, ...rows.map((r) => `"${r.disposition}",${r.count},${r.avgDurationSec}`)].join('\n');
    }
    return 'type,unsupported';
  }
}
