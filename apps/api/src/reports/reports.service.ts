import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ReportType =
  | 'grievances'
  | 'citizens'
  | 'cadre'
  | 'beneficiaries'
  | 'events'
  | 'projects'
  | 'assets';

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

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : '';
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return [
      { type: 'grievances', label: 'Grievances', description: 'All grievances with status, priority, assignment and SLA.' },
      { type: 'citizens', label: 'Citizens', description: 'Citizen master list with geo and contact details.' },
      { type: 'cadre', label: 'Cadre', description: 'Party cadre with role, mandal and status.' },
      { type: 'beneficiaries', label: 'Beneficiaries', description: 'Scheme beneficiaries and disbursement status.' },
      { type: 'events', label: 'Events', description: 'Events with type, status and attendance.' },
      { type: 'projects', label: 'Development Projects', description: 'Projects with budget, spend and progress.' },
      { type: 'assets', label: 'Assets', description: 'All constituency assets with category, condition and location.' },
    ];
  }

  async summary() {
    const [grievances, citizens, cadre, beneficiaries, events, projects, assets] = await Promise.all([
      this.prisma.grievance.count(),
      this.prisma.citizen.count(),
      this.prisma.cadre.count(),
      this.prisma.beneficiary.count(),
      this.prisma.event.count(),
      this.prisma.developmentProject.count(),
      this.prisma.asset.count(),
    ]);
    return {
      counts: { grievances, citizens, cadre, beneficiaries, events, projects, assets },
      reports: this.list(),
    };
  }

  async generateCsv(type: ReportType): Promise<{ filename: string; csv: string; rows: number }> {
    const stamp = new Date().toISOString().slice(0, 10);
    switch (type) {
      case 'grievances': {
        const rows = await this.prisma.grievance.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            citizen: { select: { name: true } },
            department: { select: { name: true } },
            mandal: { select: { name: true } },
          },
        });
        const csv = toCsv(rows, [
            { header: 'Code', value: (g) => g.code },
            { header: 'Title', value: (g) => g.title },
            { header: 'Status', value: (g) => g.status },
            { header: 'Priority', value: (g) => g.priority },
            { header: 'Channel', value: (g) => g.channel },
            { header: 'Citizen', value: (g) => g.citizen?.name ?? g.reportedByName },
            { header: 'Department', value: (g) => g.department?.name },
            { header: 'Mandal', value: (g) => g.mandal?.name },
            { header: 'SLA Due', value: (g) => fmtDate(g.slaDueAt) },
            { header: 'Resolved At', value: (g) => fmtDate(g.resolvedAt) },
            { header: 'Satisfaction', value: (g) => g.satisfactionRating },
            { header: 'Created At', value: (g) => fmtDate(g.createdAt) },
          ],
        );
        return { filename: `grievances-${stamp}.csv`, csv, rows: rows.length };
      }
      case 'citizens': {
        const rows = await this.prisma.citizen.findMany({
          orderBy: { name: 'asc' },
          include: { mandal: { select: { name: true } }, village: { select: { name: true } } },
        });
        const csv = toCsv(rows, [
            { header: 'Name', value: (c) => c.name },
            { header: 'Mobile', value: (c) => c.mobile },
            { header: 'Gender', value: (c) => c.gender },
            { header: 'Voter ID', value: (c) => c.voterId },
            { header: 'Mandal', value: (c) => c.mandal?.name },
            { header: 'Village', value: (c) => c.village?.name },
            { header: 'Status', value: (c) => c.status },
            { header: 'Created At', value: (c) => fmtDate(c.createdAt) },
          ],
        );
        return { filename: `citizens-${stamp}.csv`, csv, rows: rows.length };
      }
      case 'cadre': {
        const rows = await this.prisma.cadre.findMany({
          orderBy: { name: 'asc' },
          include: { mandal: { select: { name: true } } },
        });
        const csv = toCsv(rows, [
            { header: 'Name', value: (c) => c.name },
            { header: 'Mobile', value: (c) => c.mobile },
            { header: 'Designation', value: (c) => c.designation },
            { header: 'Level', value: (c) => c.level },
            { header: 'Mandal', value: (c) => c.mandal?.name },
            { header: 'Status', value: (c) => c.status },
            { header: 'Performance', value: (c) => c.performance },
            { header: 'Created At', value: (c) => fmtDate(c.createdAt) },
          ],
        );
        return { filename: `cadre-${stamp}.csv`, csv, rows: rows.length };
      }
      case 'beneficiaries': {
        const rows = await this.prisma.beneficiary.findMany({
          orderBy: { appliedAt: 'desc' },
          include: { scheme: { select: { name: true } }, citizen: { select: { name: true, mobile: true } } },
        });
        const csv = toCsv(rows, [
            { header: 'Citizen', value: (b) => b.citizen?.name },
            { header: 'Mobile', value: (b) => b.citizen?.mobile },
            { header: 'Scheme', value: (b) => b.scheme?.name },
            { header: 'Status', value: (b) => b.status },
            { header: 'Disbursed Amount', value: (b) => b.disbursedAmount },
            { header: 'Applied At', value: (b) => fmtDate(b.appliedAt) },
            { header: 'Disbursed At', value: (b) => fmtDate(b.disbursedAt) },
          ],
        );
        return { filename: `beneficiaries-${stamp}.csv`, csv, rows: rows.length };
      }
      case 'events': {
        const rows = await this.prisma.event.findMany({
          orderBy: { startAt: 'desc' },
          include: { _count: { select: { attendees: true } } },
        });
        const csv = toCsv(rows, [
            { header: 'Title', value: (e) => e.title },
            { header: 'Type', value: (e) => e.type },
            { header: 'Status', value: (e) => e.status },
            { header: 'Start', value: (e) => fmtDate(e.startAt) },
            { header: 'Venue', value: (e) => e.venue },
            { header: 'Attendees', value: (e) => e._count.attendees },
          ],
        );
        return { filename: `events-${stamp}.csv`, csv, rows: rows.length };
      }
      case 'projects': {
        const rows = await this.prisma.developmentProject.findMany({ orderBy: { createdAt: 'desc' } });
        const csv = toCsv(rows, [
            { header: 'Name', value: (p) => p.name },
            { header: 'Category', value: (p) => p.category },
            { header: 'Status', value: (p) => p.status },
            { header: 'Budget', value: (p) => p.budget },
            { header: 'Spent', value: (p) => p.spent },
            { header: 'Progress %', value: (p) => p.progressPct },
            { header: 'Start', value: (p) => fmtDate(p.startDate) },
          ],
        );
        return { filename: `projects-${stamp}.csv`, csv, rows: rows.length };
      }
      case 'assets': {
        const rows = await this.prisma.asset.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            mandal: { select: { name: true } },
            village: { select: { name: true } },
            road: true,
            hospital: true,
            school: true,
            rws: true,
          },
        });
        const csv = toCsv(rows, [
          { header: 'Code', value: (a) => a.code },
          { header: 'Name', value: (a) => a.name },
          { header: 'Category', value: (a) => a.category },
          { header: 'Status', value: (a) => a.status },
          { header: 'Condition', value: (a) => a.condition },
          { header: 'Mandal', value: (a) => a.mandal?.name },
          { header: 'Village', value: (a) => a.village?.name },
          { header: 'Ward', value: (a) => a.wardNumber },
          { header: 'Contractor', value: (a) => a.contractor },
          { header: 'Road Length (km)', value: (a) => a.road?.lengthKm },
          { header: 'Hospital Beds', value: (a) => a.hospital?.bedsCount },
          { header: 'Students', value: (a) => a.school?.studentCount },
          { header: 'RWS Functional', value: (a) => (a.rws ? (a.rws.functional ? 'Yes' : 'No') : '') },
          { header: 'Created At', value: (a) => fmtDate(a.createdAt) },
        ]);
        return { filename: `assets-${stamp}.csv`, csv, rows: rows.length };
      }
      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }
}
