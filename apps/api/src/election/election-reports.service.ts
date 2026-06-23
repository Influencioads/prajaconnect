import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ElectionCommonService } from './election-common.service';
import {
  CreateElectionDto,
  CreateReportDto,
  ElectionQueryDto,
  ReportExportQueryDto,
  UpdateElectionDto,
} from './dto/election.dto';

@Injectable()
export class ElectionSettingsService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async list(query: ElectionQueryDto) {
    const { page, limit, search } = query;
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.constituencyId) where.constituencyId = query.constituencyId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.election.findMany({
        where,
        include: { constituency: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.election.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.election.findUnique({
      where: { id },
      include: { constituency: { select: { id: true, name: true } } },
    });
    if (!row) throw new NotFoundException('Election not found');
    return row;
  }

  async getActive() {
    const id = await this.common.resolveElectionId();
    return this.get(id);
  }

  async create(dto: CreateElectionDto, user: AuthenticatedUser) {
    return this.prisma.election.create({
      data: {
        name: dto.name,
        type: dto.type,
        electionDate: dto.electionDate ? new Date(dto.electionDate) : undefined,
        status: dto.status,
        totalBudget: dto.totalBudget ?? 0,
        description: dto.description,
        constituencyId: dto.constituencyId,
        createdById: user.id,
      },
      include: { constituency: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateElectionDto) {
    await this.get(id);
    return this.prisma.election.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        electionDate: dto.electionDate ? new Date(dto.electionDate) : undefined,
        status: dto.status,
        totalBudget: dto.totalBudget,
        description: dto.description,
        constituencyId: dto.constituencyId,
      },
      include: { constituency: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.election.delete({ where: { id } });
    return { ok: true };
  }
}

interface ReportColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function toCsv<T>(rows: T[], columns: ReportColumn<T>[]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = columns.map((c) => escape(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escape(c.value(row))).join(',')).join('\n');
  return `${head}\n${body}`;
}

function toHtmlTable<T>(title: string, rows: T[], columns: ReportColumn<T>[]): string {
  const head = columns.map((c) => `<th>${c.header}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${c.value(row) ?? ''}</td>`).join('')}</tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#003366;color:#fff}
h1{color:#003366}</style></head><body><h1>${title}</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

@Injectable()
export class ElectionReportsService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  listTypes() {
    return [
      { type: 'expense', label: 'Expense Report' },
      { type: 'booth', label: 'Booth Report' },
      { type: 'vehicle', label: 'Vehicle Report' },
      { type: 'campaign-work', label: 'Campaign Work Report' },
      { type: 'team-performance', label: 'Team Performance Report' },
      { type: 'material-distribution', label: 'Material Distribution Report' },
      { type: 'voter-outreach', label: 'Voter Outreach Report' },
      { type: 'polling-day', label: 'Polling Day Report' },
      { type: 'mandal-wise', label: 'Mandal-wise Report' },
      { type: 'village-wise', label: 'Village-wise Report' },
      { type: 'daily-summary', label: 'Daily Election Summary' },
    ];
  }

  async create(dto: CreateReportDto, user: AuthenticatedUser) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    return this.prisma.electionReport.create({
      data: {
        electionId,
        type: dto.type,
        title: dto.title ?? `${dto.type} Report`,
        filters: (dto.filters ?? {}) as object,
        generatedById: user.id,
      },
    });
  }

  async listReports(electionId?: string) {
    const eid = await this.common.resolveElectionId(electionId);
    return this.prisma.electionReport.findMany({
      where: { electionId: eid },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { generatedBy: { select: { id: true, name: true } } },
    });
  }

  async export(type: string, query: ReportExportQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const format = query.format ?? 'csv';
    const stamp = new Date().toISOString().slice(0, 10);
    const { rows, columns, title } = await this.fetchReportData(type, electionId, query);
    const filenameBase = `election-${type}-${stamp}`;

    if (format === 'pdf') {
      return {
        filename: `${filenameBase}.html`,
        contentType: 'text/html',
        body: toHtmlTable(title, rows, columns),
        rows: rows.length,
      };
    }

    const csv = toCsv(rows, columns);
    if (format === 'xlsx') {
      return {
        filename: `${filenameBase}.csv`,
        contentType: 'text/csv',
        body: csv,
        rows: rows.length,
        note: 'Excel export uses CSV format compatible with Excel.',
      };
    }

    return {
      filename: `${filenameBase}.csv`,
      contentType: 'text/csv',
      body: csv,
      rows: rows.length,
    };
  }

  private async fetchReportData(type: string, electionId: string, query: ReportExportQueryDto) {
    const dateFilter =
      query.from || query.to
        ? {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          }
        : undefined;

    switch (type) {
      case 'expense': {
        const rows = await this.prisma.electionExpense.findMany({
          where: { electionId, ...(dateFilter ? { expenseDate: dateFilter } : {}) },
          include: {
            category: { select: { label: true } },
            mandal: { select: { name: true } },
            booth: { select: { number: true } },
          },
          orderBy: { expenseDate: 'desc' },
        });
        return {
          title: 'Election Expense Report',
          rows,
          columns: [
            { header: 'Title', value: (r: (typeof rows)[0]) => r.title },
            { header: 'Category', value: (r) => r.category.label },
            { header: 'Amount', value: (r) => r.amount },
            { header: 'Date', value: (r) => r.expenseDate.toISOString().slice(0, 10) },
            { header: 'Status', value: (r) => r.status },
            { header: 'Mandal', value: (r) => r.mandal?.name },
            { header: 'Booth', value: (r) => r.booth?.number },
            { header: 'Vendor', value: (r) => r.vendorName },
            { header: 'Payment', value: (r) => r.paymentMode },
          ],
        };
      }
      case 'booth': {
        const rows = await this.prisma.electionBoothPlan.findMany({
          where: { electionId },
          include: {
            booth: {
              select: {
                number: true,
                name: true,
                village: { select: { name: true, mandal: { select: { name: true } } } },
              },
            },
          },
        });
        return {
          title: 'Booth Election Plan Report',
          rows,
          columns: [
            { header: 'Booth', value: (r: (typeof rows)[0]) => r.booth.number },
            { header: 'Name', value: (r) => r.booth.name },
            { header: 'Mandal', value: (r) => r.booth.village.mandal.name },
            { header: 'Village', value: (r) => r.booth.village.name },
            { header: 'Strength', value: (r) => r.strength },
            { header: 'Readiness', value: (r) => r.readinessScore },
            { header: 'Voters', value: (r) => r.voterCount },
          ],
        };
      }
      case 'vehicle': {
        const rows = await this.prisma.electionVehicle.findMany({ where: { electionId } });
        return {
          title: 'Vehicle Report',
          rows,
          columns: [
            { header: 'Number', value: (r: (typeof rows)[0]) => r.vehicleNumber },
            { header: 'Type', value: (r) => r.vehicleType },
            { header: 'Driver', value: (r) => r.driverName },
            { header: 'Mobile', value: (r) => r.driverMobile },
            { header: 'Status', value: (r) => r.status },
          ],
        };
      }
      case 'campaign-work': {
        const rows = await this.prisma.electionCampaignWork.findMany({
          where: { electionId },
          include: { mandal: { select: { name: true } }, booth: { select: { number: true } } },
        });
        return {
          title: 'Campaign Work Report',
          rows,
          columns: [
            { header: 'Title', value: (r: (typeof rows)[0]) => r.title },
            { header: 'Type', value: (r) => r.type },
            { header: 'Status', value: (r) => r.status },
            { header: 'Priority', value: (r) => r.priority },
            { header: 'Mandal', value: (r) => r.mandal?.name },
            { header: 'Booth', value: (r) => r.booth?.number },
            { header: 'Deadline', value: (r) => r.deadline?.toISOString().slice(0, 10) },
          ],
        };
      }
      case 'team-performance': {
        const rows = await this.prisma.electionCampaignTeam.findMany({
          where: { electionId },
          include: { leaderCadre: { select: { name: true } }, _count: { select: { members: true } } },
        });
        return {
          title: 'Team Performance Report',
          rows,
          columns: [
            { header: 'Team', value: (r: (typeof rows)[0]) => r.name },
            { header: 'Type', value: (r) => r.type },
            { header: 'Leader', value: (r) => r.leaderCadre?.name },
            { header: 'Members', value: (r) => r._count.members },
            { header: 'Score', value: (r) => r.performanceScore },
          ],
        };
      }
      case 'material-distribution': {
        const rows = await this.prisma.electionMaterialDistribution.findMany({
          where: { material: { electionId } },
          include: {
            material: { select: { name: true, type: true } },
            mandal: { select: { name: true } },
            booth: { select: { number: true } },
          },
        });
        return {
          title: 'Material Distribution Report',
          rows,
          columns: [
            { header: 'Material', value: (r: (typeof rows)[0]) => r.material.name },
            { header: 'Type', value: (r) => r.material.type },
            { header: 'Qty', value: (r) => r.quantity },
            { header: 'Returned', value: (r) => r.returnedQty },
            { header: 'Mandal', value: (r) => r.mandal?.name },
            { header: 'Booth', value: (r) => r.booth?.number },
            { header: 'Date', value: (r) => r.distributedAt.toISOString().slice(0, 10) },
          ],
        };
      }
      case 'voter-outreach': {
        const rows = await this.prisma.electionVoterOutreach.findMany({
          where: { electionId },
          include: { booth: { select: { number: true } }, mandal: { select: { name: true } } },
        });
        return {
          title: 'Voter Outreach Report',
          rows,
          columns: [
            { header: 'Contact', value: (r: (typeof rows)[0]) => r.contactName },
            { header: 'Mobile', value: (r) => r.contactMobile },
            { header: 'Channel', value: (r) => r.channel },
            { header: 'Stance', value: (r) => r.stance },
            { header: 'Mandal', value: (r) => r.mandal?.name },
            { header: 'Booth', value: (r) => r.booth?.number },
            { header: 'Follow-up', value: (r) => (r.followUpRequired ? 'Yes' : 'No') },
          ],
        };
      }
      case 'polling-day': {
        const rows = await this.prisma.electionPollingDayUpdate.findMany({
          where: { electionId },
          include: { boothPlan: { include: { booth: { select: { number: true } } } } },
          orderBy: { createdAt: 'desc' },
        });
        return {
          title: 'Polling Day Report',
          rows,
          columns: [
            { header: 'Booth', value: (r: (typeof rows)[0]) => r.boothPlan.booth.number },
            { header: 'Status', value: (r) => r.status },
            { header: 'Turnout', value: (r) => r.turnoutCount },
            { header: 'Hour', value: (r) => r.hour },
            { header: 'Issue', value: (r) => r.issueText },
            { header: 'Resolved', value: (r) => (r.resolved ? 'Yes' : 'No') },
            { header: 'Time', value: (r) => r.createdAt.toISOString() },
          ],
        };
      }
      case 'mandal-wise': {
        const rows = await this.prisma.electionExpense.groupBy({
          by: ['mandalId'],
          where: { electionId, mandalId: { not: null } },
          _sum: { amount: true },
          _count: { _all: true },
        });
        const enriched = await Promise.all(
          rows.map(async (r) => {
            const mandal = r.mandalId
              ? await this.prisma.mandal.findUnique({ where: { id: r.mandalId }, select: { name: true } })
              : null;
            return { mandalName: mandal?.name ?? 'Unknown', total: r._sum.amount ?? 0, count: r._count._all };
          }),
        );
        return {
          title: 'Mandal-wise Expense Report',
          rows: enriched,
          columns: [
            { header: 'Mandal', value: (r: (typeof enriched)[0]) => r.mandalName },
            { header: 'Expenses', value: (r) => r.count },
            { header: 'Total Amount', value: (r) => r.total },
          ],
        };
      }
      case 'village-wise': {
        const rows = await this.prisma.electionCampaignWork.groupBy({
          by: ['villageId'],
          where: { electionId, villageId: { not: null } },
          _count: { _all: true },
        });
        const enriched = await Promise.all(
          rows.map(async (r) => {
            const village = r.villageId
              ? await this.prisma.village.findUnique({ where: { id: r.villageId }, select: { name: true } })
              : null;
            return { villageName: village?.name ?? 'Unknown', works: r._count._all };
          }),
        );
        return {
          title: 'Village-wise Campaign Work Report',
          rows: enriched,
          columns: [
            { header: 'Village', value: (r: (typeof enriched)[0]) => r.villageName },
            { header: 'Works', value: (r) => r.works },
          ],
        };
      }
      case 'daily-summary': {
        const rows = await this.prisma.electionExpense.groupBy({
          by: ['expenseDate'],
          where: { electionId, ...(dateFilter ? { expenseDate: dateFilter } : {}) },
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: { expenseDate: 'desc' },
        });
        return {
          title: 'Daily Election Summary',
          rows,
          columns: [
            { header: 'Date', value: (r: (typeof rows)[0]) => r.expenseDate.toISOString().slice(0, 10) },
            { header: 'Expenses', value: (r) => r._count._all },
            { header: 'Amount', value: (r) => r._sum.amount ?? 0 },
          ],
        };
      }
      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }
}
