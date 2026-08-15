import { Injectable } from '@nestjs/common';
import { TempGrievanceStatus } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';

const MS_PER_DAY = 86400000;

/** Half-open time window [gte, lt) — assignable to both DateTime and nullable DateTime filters. */
interface DateWindow {
  gte: Date;
  lt: Date;
}

export interface BulletinKpi {
  label: string;
  value: number | string;
  delta?: number;
}

export interface BulletinSection {
  key: string;
  title: string;
  kpis: BulletinKpi[];
  rows?: Record<string, unknown>[];
}

export interface BulletinScope {
  mandalId?: string;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Assembles every bulletin section into one JSON payload by reusing the same
 * queries the individual modules run for their dashboards.
 *
 * Window semantics: a bulletin dated D covers the window ENDING at 00:00 of D
 * (daily = yesterday, weekly = last 7 days, monthly = last 30 days). Deltas
 * compare against the previous same-length window. "Today" sections (tasks
 * due, schedule, scheme deadlines) use the bulletin date itself.
 */
@Injectable()
export class BulletinAggregationService {
  constructor(private prisma: PrismaService) {}

  windowDays(edition: string): number {
    return edition === 'monthly' ? 30 : edition === 'weekly' ? 7 : 1;
  }

  async buildSections(date: Date, edition = 'daily', scope?: BulletinScope): Promise<BulletinSection[]> {
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
    const days = this.windowDays(edition);
    const end = dayStart;
    const start = new Date(end.getTime() - days * MS_PER_DAY);
    const prevStart = new Date(start.getTime() - days * MS_PER_DAY);
    const win = { gte: start, lt: end };
    const prevWin = { gte: prevStart, lt: start };
    const today = { gte: dayStart, lt: dayEnd };
    const mandalWhere = scope?.mandalId ? { mandalId: scope.mandalId } : {};

    const sections = await Promise.all([
      this.grievances(win, prevWin, mandalWhere),
      this.tempIntake(win, prevWin, mandalWhere),
      this.attendance(win, prevWin, scope?.mandalId),
      this.d2d(win, prevWin),
      this.eventsAndActivities(win, prevWin, mandalWhere),
      this.callCenter(win, prevWin),
      this.tasksDueToday(today),
      this.schedule(today),
      this.prDigest(),
      this.schemeDeadlines(dayStart),
    ]);
    return sections;
  }

  private async grievances(
    win: DateWindow,
    prevWin: DateWindow,
    mandalWhere: { mandalId?: string },
  ): Promise<BulletinSection> {
    const [created, prevCreated, resolved, prevResolved, breached, prevBreached, openTotal, recent] =
      await Promise.all([
        this.prisma.grievance.count({ where: { createdAt: win, ...mandalWhere } }),
        this.prisma.grievance.count({ where: { createdAt: prevWin, ...mandalWhere } }),
        this.prisma.grievance.count({ where: { resolvedAt: win, ...mandalWhere } }),
        this.prisma.grievance.count({ where: { resolvedAt: prevWin, ...mandalWhere } }),
        this.prisma.grievanceSlaViolation.count({ where: { breachedAt: win } }),
        this.prisma.grievanceSlaViolation.count({ where: { breachedAt: prevWin } }),
        this.prisma.grievance.count({
          where: { status: { in: ['Open', 'Assigned', 'InProgress', 'Escalated'] }, ...mandalWhere },
        }),
        this.prisma.grievance.findMany({
          where: { createdAt: win, ...mandalWhere },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { code: true, title: true, status: true, priority: true },
        }),
      ]);

    return {
      key: 'grievances',
      title: 'Grievances',
      kpis: [
        { label: 'New', value: created, delta: created - prevCreated },
        { label: 'Resolved', value: resolved, delta: resolved - prevResolved },
        { label: 'SLA breached', value: breached, delta: breached - prevBreached },
        { label: 'Open backlog', value: openTotal },
      ],
      rows: recent.map((g) => ({ Code: g.code, Title: g.title, Status: g.status, Priority: g.priority })),
    };
  }

  private async tempIntake(
    win: DateWindow,
    prevWin: DateWindow,
    mandalWhere: { mandalId?: string },
  ): Promise<BulletinSection> {
    const pendingStatuses = [
      TempGrievanceStatus.New,
      TempGrievanceStatus.PendingValidation,
      TempGrievanceStatus.MoreInfoRequired,
    ];
    const [created, prevCreated, converted, prevConverted, pending, bySource] = await Promise.all([
      this.prisma.temporaryGrievance.count({ where: { createdAt: win, ...mandalWhere } }),
      this.prisma.temporaryGrievance.count({ where: { createdAt: prevWin, ...mandalWhere } }),
      this.prisma.temporaryGrievance.count({ where: { convertedAt: win, ...mandalWhere } }),
      this.prisma.temporaryGrievance.count({ where: { convertedAt: prevWin, ...mandalWhere } }),
      this.prisma.temporaryGrievance.count({
        where: { validationStatus: { in: pendingStatuses }, ...mandalWhere },
      }),
      this.prisma.temporaryGrievance.groupBy({
        by: ['source'],
        where: { createdAt: win, ...mandalWhere },
        _count: { _all: true },
      }),
    ]);

    return {
      key: 'tempIntake',
      title: 'Complaint Intake Funnel',
      kpis: [
        { label: 'Captured', value: created, delta: created - prevCreated },
        { label: 'Converted', value: converted, delta: converted - prevConverted },
        { label: 'Awaiting validation', value: pending },
      ],
      rows: bySource.map((s) => ({ Source: s.source, Captured: s._count._all })),
    };
  }

  private async attendance(
    win: DateWindow,
    prevWin: DateWindow,
    mandalId?: string,
  ): Promise<BulletinSection> {
    const cadreWhere = mandalId ? { cadre: { mandalId } } : {};
    const [checkIns, prevCheckIns, geoVerified, distinct, activeCadres] = await Promise.all([
      this.prisma.volunteerAttendance.count({ where: { checkInAt: win, ...cadreWhere } }),
      this.prisma.volunteerAttendance.count({ where: { checkInAt: prevWin, ...cadreWhere } }),
      this.prisma.volunteerAttendance.count({ where: { checkInAt: win, geoVerified: true, ...cadreWhere } }),
      this.prisma.volunteerAttendance.findMany({
        where: { checkInAt: win, ...cadreWhere },
        distinct: ['cadreId'],
        select: { cadreId: true },
      }),
      this.prisma.cadre.count({ where: { status: 'Active', ...(mandalId ? { mandalId } : {}) } }),
    ]);
    const noCheckIn = Math.max(0, activeCadres - distinct.length);

    return {
      key: 'attendance',
      title: 'Cadre Attendance',
      kpis: [
        { label: 'Check-ins', value: checkIns, delta: checkIns - prevCheckIns },
        { label: 'Geo-verified', value: geoVerified },
        { label: 'Cadres present', value: distinct.length },
        { label: 'No check-in', value: noCheckIn },
      ],
    };
  }

  private async d2d(win: DateWindow, prevWin: DateWindow): Promise<BulletinSection> {
    const [visits, prevVisits, sentiments] = await Promise.all([
      this.prisma.d2DSurveyResponse.count({ where: { submittedAt: win } }),
      this.prisma.d2DSurveyResponse.count({ where: { submittedAt: prevWin } }),
      this.prisma.d2DSurveyResponse.groupBy({
        by: ['sentiment'],
        where: { submittedAt: win, sentiment: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const sentimentKpis: BulletinKpi[] = sentiments.map((s) => ({
      label: String(s.sentiment),
      value: s._count._all,
    }));

    return {
      key: 'd2d',
      title: 'Door-to-Door Visits',
      kpis: [{ label: 'Visits', value: visits, delta: visits - prevVisits }, ...sentimentKpis],
    };
  }

  private async eventsAndActivities(
    win: DateWindow,
    prevWin: DateWindow,
    mandalWhere: { mandalId?: string },
  ): Promise<BulletinSection> {
    const [events, prevEvents, completedActivities, prevCompleted, eventRows] = await Promise.all([
      this.prisma.event.count({ where: { startAt: win, status: { not: 'Cancelled' }, ...mandalWhere } }),
      this.prisma.event.count({ where: { startAt: prevWin, status: { not: 'Cancelled' }, ...mandalWhere } }),
      this.prisma.activity.count({ where: { completedAt: win } }),
      this.prisma.activity.count({ where: { completedAt: prevWin } }),
      this.prisma.event.findMany({
        where: { startAt: win, status: { not: 'Cancelled' }, ...mandalWhere },
        orderBy: { startAt: 'desc' },
        take: 5,
        select: { title: true, type: true, venue: true, startAt: true },
      }),
    ]);

    return {
      key: 'events',
      title: 'Events & Activities',
      kpis: [
        { label: 'Events held', value: events, delta: events - prevEvents },
        { label: 'Activities completed', value: completedActivities, delta: completedActivities - prevCompleted },
      ],
      rows: eventRows.map((e) => ({
        Title: e.title,
        Type: e.type,
        Venue: e.venue ?? '',
        When: e.startAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      })),
    };
  }

  private async callCenter(win: DateWindow, prevWin: DateWindow): Promise<BulletinSection> {
    const [calls, prevCalls, dispositions] = await Promise.all([
      this.prisma.callLog.count({ where: { createdAt: win } }),
      this.prisma.callLog.count({ where: { createdAt: prevWin } }),
      this.prisma.callLog.groupBy({
        by: ['disposition'],
        where: { createdAt: win, disposition: { not: null } },
        _count: { _all: true },
      }),
    ]);

    return {
      key: 'callCenter',
      title: 'Call Center',
      kpis: [{ label: 'Calls', value: calls, delta: calls - prevCalls }],
      rows: dispositions
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 5)
        .map((d) => ({ Disposition: String(d.disposition), Calls: d._count._all })),
    };
  }

  private async tasksDueToday(today: DateWindow): Promise<BulletinSection> {
    const [leaderTasks, reminders, electionWorks] = await Promise.all([
      this.prisma.leaderPersonalTask.findMany({
        where: { dueDate: today, status: { notIn: ['Completed', 'Cancelled'] } },
        select: { title: true, dueDate: true },
      }),
      this.prisma.activityReminder.findMany({
        where: { remindAt: today, sent: false },
        select: { remindAt: true, note: true, activity: { select: { title: true } } },
      }),
      this.prisma.electionCampaignWork.findMany({
        where: { deadline: today, status: { in: ['NotStarted', 'InProgress', 'Delayed'] } },
        select: { title: true, deadline: true },
      }),
    ]);

    const rows = [
      ...leaderTasks.map((t) => ({ Source: 'Personal task', Task: t.title })),
      ...reminders.map((r) => ({ Source: 'Activity reminder', Task: r.activity.title })),
      ...electionWorks.map((w) => ({ Source: 'Campaign work', Task: w.title })),
    ];

    return {
      key: 'tasks',
      title: 'Tasks Due Today',
      kpis: [
        { label: 'Total due', value: rows.length },
        { label: 'Personal', value: leaderTasks.length },
        { label: 'Reminders', value: reminders.length },
        { label: 'Campaign works', value: electionWorks.length },
      ],
      rows,
    };
  }

  private async schedule(today: DateWindow): Promise<BulletinSection> {
    const [blocks, appointments] = await Promise.all([
      this.prisma.leaderScheduleBlock.findMany({
        where: { startAt: today },
        orderBy: { startAt: 'asc' },
        select: { title: true, startAt: true, endAt: true },
      }),
      this.prisma.appointmentRequest.findMany({
        where: { scheduledAt: today, status: 'Approved' },
        orderBy: { scheduledAt: 'asc' },
        select: { visitorName: true, purpose: true, scheduledAt: true },
      }),
    ]);

    const fmt = (d: Date) =>
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

    const rows = [
      ...blocks.map((b) => ({ Time: fmt(b.startAt), Item: b.title, Kind: 'Schedule' })),
      ...appointments.map((a) => ({
        Time: a.scheduledAt ? fmt(a.scheduledAt) : '',
        Item: `${a.visitorName} — ${a.purpose}`,
        Kind: 'Appointment',
      })),
    ].sort((a, b) => String(a.Time).localeCompare(String(b.Time)));

    return {
      key: 'schedule',
      title: "Today's Schedule",
      kpis: [
        { label: 'Schedule blocks', value: blocks.length },
        { label: 'Appointments', value: appointments.length },
      ],
      rows,
    };
  }

  private async prDigest(): Promise<BulletinSection> {
    const [latestReport, unackAlerts, openAlerts] = await Promise.all([
      this.prisma.prReport.findFirst({ orderBy: { createdAt: 'desc' } }),
      this.prisma.prAlert.count({ where: { acknowledgedAt: null, status: 'Open' } }),
      this.prisma.prAlert.findMany({
        where: { acknowledgedAt: null, status: 'Open' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { title: true, severity: true },
      }),
    ]);

    const rows: Record<string, unknown>[] = openAlerts.map((a) => ({ Alert: a.title, Severity: a.severity }));
    if (latestReport?.summary) rows.unshift({ Alert: `News digest: ${latestReport.summary}`, Severity: '' });

    return {
      key: 'pr',
      title: 'Media & PR',
      kpis: [{ label: 'Unacknowledged alerts', value: unackAlerts }],
      rows,
    };
  }

  private async schemeDeadlines(dayStart: Date): Promise<BulletinSection> {
    const weekAhead = new Date(dayStart.getTime() + 7 * MS_PER_DAY);
    const schemes = await this.prisma.scheme.findMany({
      where: { status: 'Active', endDate: { gte: dayStart, lt: weekAhead } },
      orderBy: { endDate: 'asc' },
      select: { name: true, code: true, endDate: true },
    });

    return {
      key: 'schemes',
      title: 'Scheme Deadlines (7 days)',
      kpis: [{ label: 'Closing soon', value: schemes.length }],
      rows: schemes.map((s) => ({
        Scheme: s.name,
        Code: s.code,
        'Ends on': s.endDate ? s.endDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      })),
    };
  }
}
