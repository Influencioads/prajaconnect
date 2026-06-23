import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TempGrievancesReportsService {
  constructor(private prisma: PrismaService) {}

  async dailyReport(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const items = await this.prisma.temporaryGrievance.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      select: { createdAt: true, validationStatus: true, source: true },
    });

    const byDay: Record<string, { created: number; converted: number; rejected: number }> = {};
    for (const item of items) {
      const day = item.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { created: 0, converted: 0, rejected: 0 };
      byDay[day].created++;
      if (item.validationStatus === 'Converted') byDay[day].converted++;
      if (item.validationStatus === 'Rejected' || item.validationStatus === 'Archived') byDay[day].rejected++;
    }

    return { from: fromDate, to: toDate, byDay, total: items.length };
  }

  async sourceWiseReport() {
    const grouped = await this.prisma.temporaryGrievance.groupBy({
      by: ['source', 'validationStatus'],
      _count: { _all: true },
    });
    const bySource: Record<string, { total: number; converted: number; pending: number }> = {};
    for (const g of grouped) {
      if (!bySource[g.source]) bySource[g.source] = { total: 0, converted: 0, pending: 0 };
      bySource[g.source].total += g._count._all;
      if (g.validationStatus === 'Converted') bySource[g.source].converted += g._count._all;
      if (['New', 'PendingValidation', 'MoreInfoRequired', 'Validated'].includes(g.validationStatus)) {
        bySource[g.source].pending += g._count._all;
      }
    }
    return { bySource };
  }

  async validatorPerformanceReport() {
    const validators = await this.prisma.temporaryGrievance.groupBy({
      by: ['assignedValidatorId', 'validationStatus'],
      _count: { _all: true },
      where: { assignedValidatorId: { not: null } },
    });

    const validatorIds = [...new Set(validators.map((v) => v.assignedValidatorId!))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: validatorIds } },
      select: { id: true, name: true },
    });

    const perf: Record<string, { name: string; assigned: number; validated: number; converted: number; rejected: number }> = {};
    for (const v of validators) {
      const id = v.assignedValidatorId!;
      if (!perf[id]) {
        perf[id] = {
          name: users.find((u) => u.id === id)?.name ?? 'Unknown',
          assigned: 0,
          validated: 0,
          converted: 0,
          rejected: 0,
        };
      }
      perf[id].assigned += v._count._all;
      if (v.validationStatus === 'Validated') perf[id].validated += v._count._all;
      if (v.validationStatus === 'Converted') perf[id].converted += v._count._all;
      if (v.validationStatus === 'Rejected' || v.validationStatus === 'Archived') perf[id].rejected += v._count._all;
    }

    return { validators: Object.values(perf) };
  }

  async conversionRateReport() {
    const total = await this.prisma.temporaryGrievance.count();
    const converted = await this.prisma.temporaryGrievance.count({ where: { validationStatus: 'Converted' } });
    const rejected = await this.prisma.temporaryGrievance.count({
      where: { validationStatus: { in: ['Rejected', 'Archived', 'Duplicate'] } },
    });
    const pending = total - converted - rejected;

    return {
      total,
      converted,
      rejected,
      pending,
      conversionRate: total ? Math.round((converted / total) * 100) : 0,
      rejectionRate: total ? Math.round((rejected / total) * 100) : 0,
    };
  }

  async duplicateReport() {
    const duplicates = await this.prisma.temporaryGrievanceDuplicate.findMany({
      include: {
        temporaryGrievance: { select: { tempTicketId: true, citizenName: true, issueSummary: true } },
      },
      orderBy: { matchScore: 'desc' },
      take: 100,
    });

    const marked = await this.prisma.temporaryGrievance.count({ where: { validationStatus: 'Duplicate' } });
    return { marked, matches: duplicates };
  }

  async rejectionReport() {
    const items = await this.prisma.temporaryGrievance.findMany({
      where: { validationStatus: { in: ['Rejected', 'Archived'] } },
      select: {
        tempTicketId: true,
        source: true,
        citizenName: true,
        issueSummary: true,
        rejectedReason: true,
        archivedReason: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return { items, total: items.length };
  }

  async mandalWiseReport() {
    const grouped = await this.prisma.temporaryGrievance.groupBy({
      by: ['mandalId'],
      _count: { _all: true },
      where: { mandalId: { not: null } },
    });
    const mandalIds = grouped.map((g) => g.mandalId!);
    const mandals = await this.prisma.mandal.findMany({
      where: { id: { in: mandalIds } },
      select: { id: true, name: true },
    });
    return {
      mandals: grouped.map((g) => ({
        mandalId: g.mandalId,
        name: mandals.find((m) => m.id === g.mandalId)?.name ?? 'Unknown',
        count: g._count._all,
      })),
    };
  }

  async villageWiseReport() {
    const grouped = await this.prisma.temporaryGrievance.groupBy({
      by: ['villageId'],
      _count: { _all: true },
      where: { villageId: { not: null } },
    });
    const villageIds = grouped.map((g) => g.villageId!);
    const villages = await this.prisma.village.findMany({
      where: { id: { in: villageIds } },
      select: { id: true, name: true },
    });
    return {
      villages: grouped.map((g) => ({
        villageId: g.villageId,
        name: villages.find((v) => v.id === g.villageId)?.name ?? 'Unknown',
        count: g._count._all,
      })),
    };
  }
}
