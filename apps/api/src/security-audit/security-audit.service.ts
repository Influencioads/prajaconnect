import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessLevel, UserRole } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class SecurityAuditService {
  constructor(private prisma: PrismaService) {}

  async logDataExport(userId: string | undefined, exportType: string) {
    await this.prisma.dataExportLog.create({
      data: { userId: userId ?? null, exportType },
    });
  }

  async logFileAccess(userId: string | undefined, filePath: string, action: string) {
    await this.prisma.fileAccessLog.create({
      data: { userId: userId ?? null, filePath, action },
    });
  }

  async dashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      loginAttemptsToday,
      failedLoginsToday,
      activeSessions,
      exportCount,
      suspiciousAlerts,
      recentLogins,
      recentExports,
    ] = await Promise.all([
      this.prisma.loginHistory.count({ where: { createdAt: { gte: today } } }),
      this.prisma.loginHistory.count({ where: { createdAt: { gte: today }, success: false } }),
      this.prisma.userSession.count({ where: { revoked: false, expiresAt: { gt: new Date() } } }),
      this.prisma.dataExportLog.count(),
      this.prisma.suspiciousActivityAlert.count({ where: { resolved: false } }),
      this.prisma.loginHistory.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.dataExportLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      loginAttemptsToday,
      failedLoginsToday,
      activeSessions,
      exportCount,
      suspiciousAlerts,
      recentLogins,
      recentExports,
    };
  }

  async loginHistory(query: PaginationDto, userId?: string) {
    const { page, limit } = query;
    const where = userId ? { userId } : {};
    const [data, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loginHistory.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listSessions(query: PaginationDto) {
    const { page, limit } = query;
    const where = { revoked: false, expiresAt: { gt: new Date() } };
    const [data, total] = await Promise.all([
      this.prisma.userSession.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.userSession.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async revokeSession(id: string) {
    const session = await this.prisma.userSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.userSession.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async exportLogs(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.dataExportLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dataExportLog.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async downloadExportLogs(userId?: string) {
    await this.logDataExport(userId, 'export-logs-csv');
    const rows = await this.prisma.dataExportLog.findMany({
      take: 5000,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    const header = 'Date,User,Email,ExportType';
    const lines = rows.map((r) =>
      [
        r.createdAt.toISOString(),
        r.user?.name ?? '',
        r.user?.email ?? '',
        r.exportType,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...lines].join('\n');
  }

  async roleActivity(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.roleActivityLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.roleActivityLog.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async fileAccess(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.fileAccessLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fileAccessLog.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async suspiciousAlerts(query: PaginationDto, resolved?: string) {
    const { page, limit } = query;
    const where =
      resolved === 'true' ? { resolved: true } : resolved === 'false' ? { resolved: false } : {};
    const [data, total] = await Promise.all([
      this.prisma.suspiciousActivityAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.suspiciousActivityAlert.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async resolveAlert(id: string) {
    const alert = await this.prisma.suspiciousActivityAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.suspiciousActivityAlert.update({
      where: { id },
      data: { resolved: true },
    });
  }

  async backupLogs(query: PaginationDto) {
    const { page, limit } = query;
    const [data, total] = await Promise.all([
      this.prisma.backupLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.backupLog.count(),
    ]);
    return {
      data: data.map((b) => ({ ...b, sizeBytes: b.sizeBytes?.toString() ?? null })),
      meta: paginate(page, limit, total),
    };
  }

  async permissionAuditDiff() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { rank: 'asc' },
    });

    const matrix = roles.map((role) => ({
      roleId: role.id,
      roleName: role.name,
      roleLabel: role.label,
      permissions: role.permissions.map((rp) => ({
        module: rp.permission.module,
        label: rp.permission.label,
        accessLevel: rp.accessLevel,
      })),
    }));

    const elevated: Array<{ roleName: string; module: string; accessLevel: AccessLevel }> = [];
    for (const role of matrix) {
      for (const perm of role.permissions) {
        if (perm.accessLevel === AccessLevel.full || perm.accessLevel === AccessLevel.edit) {
          elevated.push({
            roleName: role.roleName,
            module: perm.module,
            accessLevel: perm.accessLevel as AccessLevel,
          });
        }
      }
    }

    const baselineRole = matrix.find((r) => r.roleName === UserRole.Volunteer);
    const leaderRole = matrix.find((r) => r.roleName === UserRole.StateLeader);
    const diff: Array<{ module: string; volunteer: string | null; leader: string | null }> = [];
    if (baselineRole && leaderRole) {
      const modules = new Set([
        ...baselineRole.permissions.map((p) => p.module),
        ...leaderRole.permissions.map((p) => p.module),
      ]);
      for (const mod of modules) {
        const v = baselineRole.permissions.find((p) => p.module === mod)?.accessLevel ?? null;
        const l = leaderRole.permissions.find((p) => p.module === mod)?.accessLevel ?? null;
        if (v !== l) diff.push({ module: mod, volunteer: v, leader: l });
      }
    }

    return { matrix, elevated, diff };
  }
}
