import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { D2DReportQueryDto } from './dto/d2d.dto';

export type D2DReportType =
  | 'daily'
  | 'volunteer'
  | 'booth-coverage'
  | 'mandal-coverage'
  | 'sentiment'
  | 'grievance'
  | 'scheme-eligibility';

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
export class D2dReportsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return [
      { type: 'daily', label: 'Daily Survey Report', description: 'Surveys completed per day.' },
      { type: 'volunteer', label: 'Volunteer Performance Report', description: 'Volunteer completion and targets.' },
      { type: 'booth-coverage', label: 'Booth Coverage Report', description: 'Household coverage by booth.' },
      { type: 'mandal-coverage', label: 'Mandal Coverage Report', description: 'Household coverage by mandal.' },
      { type: 'sentiment', label: 'Sentiment Report', description: 'Political sentiment breakdown.' },
      { type: 'grievance', label: 'Grievance Report', description: 'Grievances created from surveys.' },
      { type: 'scheme-eligibility', label: 'Scheme Eligibility Report', description: 'Scheme gaps from survey data.' },
    ];
  }

  async generate(type: D2DReportType, query: D2DReportQueryDto, userId?: string) {
    const stamp = new Date().toISOString().slice(0, 10);
    const where: { surveyId?: string; submittedAt?: { gte?: Date; lte?: Date } } = {};
    if (query.surveyId) where.surveyId = query.surveyId;
    if (query.from || query.to) {
      where.submittedAt = {};
      if (query.from) where.submittedAt.gte = new Date(query.from);
      if (query.to) where.submittedAt.lte = new Date(query.to);
    }

    let csv = '';
    let rows = 0;
    let title = '';

    switch (type) {
      case 'daily': {
        const data = await this.prisma.d2DSurveyResponse.findMany({
          where,
          select: { submittedAt: true, surveyorUser: { select: { name: true } } },
          orderBy: { submittedAt: 'desc' },
        });
        const byDay: Record<string, number> = {};
        for (const d of data) {
          const day = fmtDate(d.submittedAt);
          byDay[day] = (byDay[day] ?? 0) + 1;
        }
        const reportRows = Object.entries(byDay).map(([date, count]) => ({ date, count }));
        csv = toCsv(reportRows, [
          { header: 'Date', value: (r) => r.date },
          { header: 'Responses', value: (r) => r.count },
        ]);
        rows = reportRows.length;
        title = 'Daily Survey Report';
        break;
      }
      case 'volunteer': {
        const data = await this.prisma.d2DSurveyResponse.groupBy({
          by: ['surveyorUserId'],
          _count: true,
          where: { surveyorUserId: { not: null }, ...where },
        });
        const users = await this.prisma.user.findMany({
          where: { id: { in: data.map((d) => d.surveyorUserId!).filter(Boolean) } },
          select: { id: true, name: true, mobile: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const reportRows = data.map((d) => ({
          name: userMap.get(d.surveyorUserId!)?.name ?? 'Unknown',
          mobile: userMap.get(d.surveyorUserId!)?.mobile,
          completed: d._count,
        }));
        csv = toCsv(reportRows, [
          { header: 'Volunteer', value: (r) => r.name },
          { header: 'Mobile', value: (r) => r.mobile },
          { header: 'Completed', value: (r) => r.completed },
        ]);
        rows = reportRows.length;
        title = 'Volunteer Performance Report';
        break;
      }
      case 'booth-coverage': {
        const data = await this.prisma.d2DHousehold.groupBy({
          by: ['boothId'],
          _count: true,
          where: { boothId: { not: null } },
        });
        const booths = await this.prisma.booth.findMany({
          where: { id: { in: data.map((d) => d.boothId!).filter(Boolean) } },
          select: { id: true, number: true, village: { select: { name: true } } },
        });
        const boothMap = new Map(booths.map((b) => [b.id, b]));
        const reportRows = data.map((d) => ({
          booth: boothMap.get(d.boothId!)?.number ?? d.boothId,
          village: boothMap.get(d.boothId!)?.village?.name,
          households: d._count,
        }));
        csv = toCsv(reportRows, [
          { header: 'Booth', value: (r) => r.booth },
          { header: 'Village', value: (r) => r.village },
          { header: 'Households', value: (r) => r.households },
        ]);
        rows = reportRows.length;
        title = 'Booth Coverage Report';
        break;
      }
      case 'mandal-coverage': {
        const data = await this.prisma.d2DHousehold.groupBy({
          by: ['mandalId'],
          _count: true,
          where: { mandalId: { not: null } },
        });
        const mandals = await this.prisma.mandal.findMany({
          where: { id: { in: data.map((d) => d.mandalId!).filter(Boolean) } },
          select: { id: true, name: true },
        });
        const mandalMap = new Map(mandals.map((m) => [m.id, m.name]));
        const reportRows = data.map((d) => ({
          mandal: mandalMap.get(d.mandalId!) ?? d.mandalId,
          households: d._count,
        }));
        csv = toCsv(reportRows, [
          { header: 'Mandal', value: (r) => r.mandal },
          { header: 'Households', value: (r) => r.households },
        ]);
        rows = reportRows.length;
        title = 'Mandal Coverage Report';
        break;
      }
      case 'sentiment': {
        const data = await this.prisma.d2DSurveyResponse.groupBy({
          by: ['sentiment'],
          _count: true,
          where: { sentiment: { not: null }, ...where },
        });
        const reportRows = data.map((d) => ({ sentiment: d.sentiment, count: d._count }));
        csv = toCsv(reportRows, [
          { header: 'Sentiment', value: (r) => r.sentiment },
          { header: 'Count', value: (r) => r.count },
        ]);
        rows = reportRows.length;
        title = 'Sentiment Report';
        break;
      }
      case 'grievance': {
        const data = await this.prisma.d2DSurveyResponse.findMany({
          where: { grievanceId: { not: null }, ...where },
          include: {
            grievance: { select: { code: true, title: true, status: true, category: true } },
            household: { select: { headName: true, village: { select: { name: true } } } },
          },
        });
        csv = toCsv(data, [
          { header: 'Grievance Code', value: (r) => r.grievance?.code },
          { header: 'Title', value: (r) => r.grievance?.title },
          { header: 'Status', value: (r) => r.grievance?.status },
          { header: 'Category', value: (r) => r.grievance?.category },
          { header: 'Citizen', value: (r) => r.household?.headName },
          { header: 'Village', value: (r) => r.household?.village?.name },
          { header: 'Submitted', value: (r) => fmtDate(r.submittedAt) },
        ]);
        rows = data.length;
        title = 'Grievance Report';
        break;
      }
      case 'scheme-eligibility': {
        const members = await this.prisma.d2DFamilyMember.findMany({
          select: { name: true, age: true, schemeBenefits: true, issues: true, household: { select: { headName: true, village: { select: { name: true } } } } },
          take: 500,
        });
        const reportRows = members.filter((m) => {
          const issues = Array.isArray(m.issues) ? (m.issues as string[]) : [];
          return issues.some((i) => ['Pension', 'Ration', 'HouseSite'].includes(i));
        });
        csv = toCsv(reportRows, [
          { header: 'Member', value: (r) => r.name },
          { header: 'Age', value: (r) => r.age },
          { header: 'Head', value: (r) => r.household?.headName },
          { header: 'Village', value: (r) => r.household?.village?.name },
          { header: 'Issues', value: (r) => (Array.isArray(r.issues) ? (r.issues as string[]).join('; ') : '') },
        ]);
        rows = reportRows.length;
        title = 'Scheme Eligibility Report';
        break;
      }
      default:
        throw new BadRequestException('Unknown report type');
    }

    const report = await this.prisma.d2DSurveyReport.create({
      data: {
        surveyId: query.surveyId,
        type,
        title,
        params: query as object,
        summary: { rows },
        generatedById: userId,
      },
    });

    return {
      report,
      filename: `d2d-${type}-${stamp}.csv`,
      csv,
      rows,
      title,
    };
  }
}
