import { Injectable, NotFoundException } from '@nestjs/common';
import { EscalationStatus, GrievancePriority, WarRoomAlertSeverity } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class WarRoomService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [openAlerts, openEscalations, boothScores, mandalScores, recentFeed] = await Promise.all([
      this.prisma.warRoomAlert.count({ where: { resolved: false } }),
      this.prisma.electionEscalation.count({ where: { status: { in: ['Open', 'InProgress'] } } }),
      this.prisma.boothReadinessScore.findMany({ take: 10, orderBy: { score: 'desc' }, include: { booth: { select: { number: true, name: true } } } }),
      this.prisma.mandalReadinessScore.findMany({ take: 10, orderBy: { score: 'desc' }, include: { mandal: { select: { name: true } } } }),
      this.prisma.warRoomActivityFeed.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
    ]);
    const briefing = await this.prisma.dailyBriefing.findFirst({ orderBy: { date: 'desc' } });
    const tasksPending = await this.prisma.activity.count({ where: { status: 'Planned' } });
    const grievancesOpen = await this.prisma.grievance.count({ where: { status: { in: ['Open', 'InProgress'] } } });
    return { openAlerts, openEscalations, boothScores, mandalScores, recentFeed, briefing, tasksPending, grievancesOpen };
  }

  async listAlerts(query: PaginationDto & { resolved?: string; severity?: string }) {
    const { page, limit, resolved, severity } = query;
    const where: Record<string, unknown> = {};
    if (resolved === 'true') where.resolved = true;
    if (resolved === 'false') where.resolved = false;
    if (severity) where.severity = severity;
    const [data, total] = await Promise.all([
      this.prisma.warRoomAlert.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.warRoomAlert.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createAlert(body: { title: string; message: string; severity?: string; mandalId?: string; boothId?: string }, userId?: string) {
    const alert = await this.prisma.warRoomAlert.create({
      data: {
        title: body.title,
        message: body.message,
        severity: (body.severity as WarRoomAlertSeverity) ?? WarRoomAlertSeverity.Medium,
        mandalId: body.mandalId,
        boothId: body.boothId,
      },
    });
    await this.logActivity('alert_created', `Alert: ${body.title}`, 'WarRoomAlert', alert.id, userId);
    return alert;
  }

  async resolveAlert(id: string, userId?: string) {
    const alert = await this.prisma.warRoomAlert.update({ where: { id }, data: { resolved: true } });
    await this.logActivity('alert_resolved', `Resolved: ${alert.title}`, 'WarRoomAlert', id, userId);
    return alert;
  }

  async listEscalations(query: PaginationDto & { status?: string }) {
    const { page, limit, status } = query;
    const where = status ? { status: status as EscalationStatus } : {};
    const [data, total] = await Promise.all([
      this.prisma.electionEscalation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { assignedTo: { select: { id: true, name: true } } },
      }),
      this.prisma.electionEscalation.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getEscalation(id: string) {
    const e = await this.prisma.electionEscalation.findUnique({
      where: { id },
      include: { assignedTo: { select: { id: true, name: true } }, mandal: { select: { name: true } } },
    });
    if (!e) throw new NotFoundException('Escalation not found');
    return e;
  }

  async createEscalation(body: { title: string; description?: string; priority?: string; mandalId?: string }, userId?: string) {
    const priority: GrievancePriority =
      body.priority === 'High' || body.priority === 'Low' ? body.priority : GrievancePriority.Medium;
    const e = await this.prisma.electionEscalation.create({
      data: { title: body.title, description: body.description, priority, mandalId: body.mandalId },
    });
    await this.logActivity('escalation_created', `Escalation: ${body.title}`, 'ElectionEscalation', e.id, userId);
    return e;
  }

  async updateEscalation(id: string, body: { status?: string; assignedToId?: string; description?: string }, userId?: string) {
    const e = await this.prisma.electionEscalation.update({
      where: { id },
      data: {
        status: body.status as EscalationStatus | undefined,
        assignedToId: body.assignedToId,
        description: body.description,
      },
    });
    await this.logActivity('escalation_updated', `Updated escalation ${id}`, 'ElectionEscalation', id, userId);
    return e;
  }

  async listReadinessBooths(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.boothReadinessScore.findMany({
        include: { booth: { select: { number: true, name: true, village: { select: { name: true } } } } },
        orderBy: { score: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.boothReadinessScore.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listReadinessMandals(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.mandalReadinessScore.findMany({
        include: { mandal: { select: { name: true } } },
        orderBy: { score: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mandalReadinessScore.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listActivityFeed(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.warRoomActivityFeed.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.warRoomActivityFeed.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listBriefings(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.dailyBriefing.findMany({
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { createdBy: { select: { name: true } } },
      }),
      this.prisma.dailyBriefing.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async generateBriefing(userId: string) {
    const metrics = await this.dashboard();
    const summary = `War Room Briefing: ${metrics.openAlerts} active alerts, ${metrics.openEscalations} escalations, ${metrics.grievancesOpen} open grievances, ${metrics.tasksPending} pending tasks.`;
    const briefing = await this.prisma.dailyBriefing.create({ data: { summary, metrics, createdById: userId } });
    await this.logActivity('briefing_generated', 'Daily briefing generated', undefined, undefined, userId);
    return briefing;
  }

  async exportCsv(type: string) {
    if (type === 'alerts') {
      const rows = await this.prisma.warRoomAlert.findMany({ take: 5000 });
      const header = 'title,severity,resolved,createdAt';
      return [header, ...rows.map((r) => `"${r.title}","${r.severity}",${r.resolved},${r.createdAt.toISOString()}`)].join('\n');
    }
    if (type === 'escalations') {
      const rows = await this.prisma.electionEscalation.findMany({ take: 5000 });
      const header = 'title,status,priority,createdAt';
      return [header, ...rows.map((r) => `"${r.title}","${r.status}","${r.priority}",${r.createdAt.toISOString()}`)].join('\n');
    }
    if (type === 'readiness') {
      const booths = await this.prisma.boothReadinessScore.findMany({ include: { booth: true } });
      const header = 'booth,score';
      return [header, ...booths.map((b) => `${b.booth.number},${b.score}`)].join('\n');
    }
    return 'type,unsupported';
  }

  async logActivity(action: string, summary: string, entity?: string, entityId?: string, userId?: string) {
    return this.prisma.warRoomActivityFeed.create({ data: { action, summary, entity, entityId, userId } });
  }
}
