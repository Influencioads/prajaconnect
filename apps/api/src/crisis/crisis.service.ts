import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrisisIssueStatus, CrisisSeverity, Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import { toCsv, fmtCsvDate } from '../common/utils/csv.util';

@Injectable()
export class CrisisService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [
      openIssues,
      activeIssues,
      severityCounts,
      escalationCount,
      rrtCount,
      recentIssues,
      recentTimeline,
    ] = await Promise.all([
      this.prisma.crisisIssue.count({ where: { status: CrisisIssueStatus.Open } }),
      this.prisma.crisisIssue.count({ where: { status: CrisisIssueStatus.Active } }),
      this.prisma.crisisIssue.groupBy({
        by: ['severity'],
        where: { status: { in: [CrisisIssueStatus.Open, CrisisIssueStatus.Active] } },
        _count: { _all: true },
      }),
      this.prisma.crisisEscalation.count(),
      this.prisma.emergencyResponse.count(),
      this.prisma.crisisIssue.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          village: { select: { id: true, name: true } },
          mandal: { select: { id: true, name: true } },
          _count: { select: { timeline: true, escalations: true, responses: true } },
        },
      }),
      this.prisma.crisisTimelineEntry.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          issue: { select: { id: true, title: true, severity: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    const bySeverity = Object.fromEntries(
      severityCounts.map((s) => [s.severity, s._count._all]),
    );

    return {
      openIssues,
      activeIssues,
      bySeverity,
      escalationCount,
      rrtCount,
      recentIssues,
      recentTimeline,
    };
  }

  async listIssues(query: PaginationDto, status?: string, severity?: string) {
    const { page, limit, search } = query;
    const where: Prisma.CrisisIssueWhereInput = {};
    if (status) where.status = status as CrisisIssueStatus;
    if (severity) where.severity = severity as CrisisSeverity;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.crisisIssue.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          village: { select: { id: true, name: true } },
          mandal: { select: { id: true, name: true } },
          _count: { select: { timeline: true, escalations: true, responses: true } },
        },
      }),
      this.prisma.crisisIssue.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getIssue(id: string) {
    const issue = await this.prisma.crisisIssue.findUnique({
      where: { id },
      include: {
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        timeline: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
        escalations: {
          orderBy: { createdAt: 'desc' },
          include: { assignedTo: { select: { id: true, name: true } } },
        },
        responses: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignments: {
              include: { cadre: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    if (!issue) throw new NotFoundException('Crisis issue not found');
    return issue;
  }

  async createIssue(
    body: {
      title: string;
      description?: string;
      severity?: string;
      villageId?: string;
      mandalId?: string;
    },
    userId: string,
  ) {
    return this.prisma.crisisIssue.create({
      data: {
        title: body.title,
        description: body.description,
        severity: (body.severity as CrisisSeverity) ?? CrisisSeverity.Medium,
        villageId: body.villageId,
        mandalId: body.mandalId,
        timeline: {
          create: { note: 'Issue created', userId },
        },
      },
      include: {
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async updateIssue(
    id: string,
    body: {
      title?: string;
      description?: string;
      severity?: string;
      status?: string;
      villageId?: string;
      mandalId?: string;
    },
    userId: string,
  ) {
    const existing = await this.prisma.crisisIssue.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Crisis issue not found');

    const status = body.status as CrisisIssueStatus | undefined;
    const notes: string[] = [];
    if (status && status !== existing.status) notes.push(`Status changed to ${status}`);
    if (body.severity && body.severity !== existing.severity) {
      notes.push(`Severity changed to ${body.severity}`);
    }

    const issue = await this.prisma.crisisIssue.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity as CrisisSeverity | undefined,
        status,
        villageId: body.villageId,
        mandalId: body.mandalId,
      },
      include: {
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (notes.length) {
      await this.prisma.crisisTimelineEntry.create({
        data: { issueId: id, note: notes.join('; '), userId },
      });
    }

    return issue;
  }

  async addTimelineEntry(issueId: string, note: string, userId: string) {
    const issue = await this.prisma.crisisIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Crisis issue not found');
    return this.prisma.crisisTimelineEntry.create({
      data: { issueId, note, userId },
      include: {
        user: { select: { id: true, name: true } },
        issue: { select: { id: true, title: true } },
      },
    });
  }

  async listEscalations(query: PaginationDto, issueId?: string) {
    const { page, limit } = query;
    const where = issueId ? { issueId } : {};

    const [data, total] = await Promise.all([
      this.prisma.crisisEscalation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          issue: { select: { id: true, title: true, severity: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      this.prisma.crisisEscalation.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createEscalation(body: { issueId: string; level?: number; assignedToId?: string }) {
    return this.prisma.crisisEscalation.create({
      data: {
        issueId: body.issueId,
        level: body.level ?? 1,
        assignedToId: body.assignedToId,
      },
      include: {
        issue: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async updateEscalation(
    id: string,
    body: { level?: number; assignedToId?: string },
  ) {
    const existing = await this.prisma.crisisEscalation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Escalation not found');
    return this.prisma.crisisEscalation.update({
      where: { id },
      data: body,
      include: {
        issue: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async deleteEscalation(id: string) {
    const existing = await this.prisma.crisisEscalation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Escalation not found');
    await this.prisma.crisisEscalation.delete({ where: { id } });
    return { ok: true };
  }

  async listSensitiveAreas(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.sensitiveArea.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { village: { select: { id: true, name: true } } },
      }),
      this.prisma.sensitiveArea.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createSensitiveArea(body: { name: string; riskLevel?: string; villageId?: string }) {
    return this.prisma.sensitiveArea.create({
      data: body,
      include: { village: { select: { id: true, name: true } } },
    });
  }

  async updateSensitiveArea(
    id: string,
    body: { name?: string; riskLevel?: string; villageId?: string },
  ) {
    const existing = await this.prisma.sensitiveArea.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sensitive area not found');
    return this.prisma.sensitiveArea.update({
      where: { id },
      data: body,
      include: { village: { select: { id: true, name: true } } },
    });
  }

  async deleteSensitiveArea(id: string) {
    const existing = await this.prisma.sensitiveArea.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sensitive area not found');
    await this.prisma.sensitiveArea.delete({ where: { id } });
    return { ok: true };
  }

  async listProtestEvents(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? { location: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.protestEvent.findMany({
        where,
        orderBy: { eventDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.protestEvent.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createProtestEvent(body: {
    location: string;
    eventDate?: string;
    participants?: number;
    notes?: string;
  }) {
    return this.prisma.protestEvent.create({
      data: {
        location: body.location,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        participants: body.participants,
        notes: body.notes,
      },
    });
  }

  async updateProtestEvent(
    id: string,
    body: { location?: string; eventDate?: string; participants?: number; notes?: string },
  ) {
    const existing = await this.prisma.protestEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Protest event not found');
    return this.prisma.protestEvent.update({
      where: { id },
      data: {
        location: body.location,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        participants: body.participants,
        notes: body.notes,
      },
    });
  }

  async deleteProtestEvent(id: string) {
    const existing = await this.prisma.protestEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Protest event not found');
    await this.prisma.protestEvent.delete({ where: { id } });
    return { ok: true };
  }

  async listEmergencyResponses(query: PaginationDto, issueId?: string) {
    const { page, limit } = query;
    const where = issueId ? { issueId } : {};

    const [data, total] = await Promise.all([
      this.prisma.emergencyResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          issue: { select: { id: true, title: true, severity: true } },
          _count: { select: { assignments: true } },
        },
      }),
      this.prisma.emergencyResponse.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createEmergencyResponse(body: { issueId: string; teamName: string; status?: string }) {
    return this.prisma.emergencyResponse.create({
      data: {
        issueId: body.issueId,
        teamName: body.teamName,
        status: body.status ?? 'Assigned',
      },
      include: { issue: { select: { id: true, title: true } } },
    });
  }

  async updateEmergencyResponse(
    id: string,
    body: { teamName?: string; status?: string },
  ) {
    const existing = await this.prisma.emergencyResponse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Emergency response not found');
    return this.prisma.emergencyResponse.update({
      where: { id },
      data: body,
      include: {
        issue: { select: { id: true, title: true } },
        assignments: { include: { cadre: { select: { id: true, name: true } } } },
      },
    });
  }

  async deleteEmergencyResponse(id: string) {
    const existing = await this.prisma.emergencyResponse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Emergency response not found');
    await this.prisma.emergencyResponse.delete({ where: { id } });
    return { ok: true };
  }

  async createRrtAssignment(body: { responseId: string; cadreId: string }) {
    return this.prisma.rapidResponseAssignment.create({
      data: body,
      include: {
        cadre: { select: { id: true, name: true } },
        response: { select: { id: true, teamName: true, issueId: true } },
      },
    });
  }

  async deleteRrtAssignment(id: string) {
    const existing = await this.prisma.rapidResponseAssignment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('RRT assignment not found');
    await this.prisma.rapidResponseAssignment.delete({ where: { id } });
    return { ok: true };
  }

  async heatmapVillages() {
    const issues = await this.prisma.crisisIssue.findMany({
      where: { status: { in: [CrisisIssueStatus.Open, CrisisIssueStatus.Active] } },
      select: {
        severity: true,
        villageId: true,
        village: { select: { id: true, name: true } },
      },
    });

    const map = new Map<
      string,
      { villageId: string; villageName: string; total: number; critical: number; high: number; medium: number; low: number }
    >();

    for (const i of issues) {
      if (!i.villageId || !i.village) continue;
      const row = map.get(i.villageId) ?? {
        villageId: i.villageId,
        villageName: i.village.name,
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
      row.total += 1;
      if (i.severity === CrisisSeverity.Critical) row.critical += 1;
      else if (i.severity === CrisisSeverity.High) row.high += 1;
      else if (i.severity === CrisisSeverity.Medium) row.medium += 1;
      else row.low += 1;
      map.set(i.villageId, row);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  async heatmapMandals() {
    const issues = await this.prisma.crisisIssue.findMany({
      where: { status: { in: [CrisisIssueStatus.Open, CrisisIssueStatus.Active] } },
      select: {
        severity: true,
        mandalId: true,
        mandal: { select: { id: true, name: true } },
      },
    });

    const map = new Map<
      string,
      { mandalId: string; mandalName: string; total: number; critical: number; high: number; medium: number; low: number }
    >();

    for (const i of issues) {
      if (!i.mandalId || !i.mandal) continue;
      const row = map.get(i.mandalId) ?? {
        mandalId: i.mandalId,
        mandalName: i.mandal.name,
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
      row.total += 1;
      if (i.severity === CrisisSeverity.Critical) row.critical += 1;
      else if (i.severity === CrisisSeverity.High) row.high += 1;
      else if (i.severity === CrisisSeverity.Medium) row.medium += 1;
      else row.low += 1;
      map.set(i.mandalId, row);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  async exportCsv(type: string) {
    if (type === 'issues') {
      const rows = await this.prisma.crisisIssue.findMany({
        take: 5000,
        orderBy: { updatedAt: 'desc' },
        include: {
          village: { select: { name: true } },
          mandal: { select: { name: true } },
        },
      });
      return toCsv(rows, [
        { header: 'title', value: (r) => r.title },
        { header: 'severity', value: (r) => r.severity },
        { header: 'status', value: (r) => r.status },
        { header: 'village', value: (r) => r.village?.name },
        { header: 'mandal', value: (r) => r.mandal?.name },
        { header: 'updatedAt', value: (r) => fmtCsvDate(r.updatedAt) },
      ]);
    }
    if (type === 'heatmap-villages') {
      const rows = await this.heatmapVillages();
      return toCsv(rows, [
        { header: 'villageName', value: (r) => r.villageName },
        { header: 'total', value: (r) => r.total },
        { header: 'critical', value: (r) => r.critical },
        { header: 'high', value: (r) => r.high },
        { header: 'medium', value: (r) => r.medium },
        { header: 'low', value: (r) => r.low },
      ]);
    }
    if (type === 'heatmap-mandals') {
      const rows = await this.heatmapMandals();
      return toCsv(rows, [
        { header: 'mandalName', value: (r) => r.mandalName },
        { header: 'total', value: (r) => r.total },
        { header: 'critical', value: (r) => r.critical },
        { header: 'high', value: (r) => r.high },
        { header: 'medium', value: (r) => r.medium },
        { header: 'low', value: (r) => r.low },
      ]);
    }
    throw new BadRequestException(`Unsupported export type: ${type}`);
  }
}
