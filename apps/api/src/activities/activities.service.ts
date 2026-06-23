import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { ActivityStatus, ActivityType } from '@praja/types';
import { ActivityType as PrismaActivityType } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { TempGrievancesService } from '../temp-grievances/temp-grievances.service';
import {
  AddActivityNoteDto,
  AddParticipantDto,
  AddReminderDto,
  ActivityCalendarQueryDto,
  ActivityQueryDto,
  ActivityTimelineQueryDto,
  CampaignQueryDto,
  ChangeActivityStatusDto,
  CompleteActivityDto,
  CreateActivityDto,
  CreateCampaignDto,
  UpdateActivityDto,
  UpdateCampaignDto,
} from './dto/activity.dto';

const COMPLETED_STATES: ActivityStatus[] = [ActivityStatus.Completed, ActivityStatus.Cancelled];

const listInclude = {
  citizen: { select: { id: true, name: true, mobile: true } },
  cadre: { select: { id: true, name: true, designation: true } },
  official: { select: { id: true, name: true, designation: true } },
  assignedToUser: { select: { id: true, name: true } },
  campaign: { select: { id: true, name: true, type: true } },
  mandal: { select: { id: true, name: true } },
  _count: { select: { participants: true, notes: true, reminders: true } },
} satisfies Prisma.ActivityInclude;

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private tempGrievances: TempGrievancesService,
  ) {}

  // ----------------------------------------------------------
  // List + filters
  // ----------------------------------------------------------
  async list(query: ActivityQueryDto, user: AuthenticatedUser) {
    const { page, limit, search } = query;
    const where: Prisma.ActivityWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.direction) where.direction = query.direction;
    if (query.assignedToUserId) where.assignedToUserId = query.assignedToUserId;
    if (query.citizenId) where.citizenId = query.citizenId;
    if (query.cadreId) where.cadreId = query.cadreId;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.grievanceId) where.grievanceId = query.grievanceId;
    if (query.eventId) where.eventId = query.eventId;
    if (query.mandalId) where.mandalId = query.mandalId;
    if (query.constituencyId) where.constituencyId = query.constituencyId;
    if (query.outcome) where.outcome = query.outcome;
    if (query.scope === 'me') where.assignedToUserId = user.id;

    const from = toDate(query.from);
    const to = toDate(query.to);
    if (from || to) {
      where.OR = [
        { scheduledAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
        { dueAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
        { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
      ];
    }

    if (search) {
      const term = { contains: search, mode: 'insensitive' as const };
      const searchOr: Prisma.ActivityWhereInput[] = [
        { title: term },
        { description: term },
        { contactName: term },
        { contactMobile: term },
        { outcome: term },
      ];
      where.AND = [...(where.OR ? [{ OR: where.OR }] : []), { OR: searchOr }];
      delete where.OR;
    }

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: listInclude,
        orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  // ----------------------------------------------------------
  // Stats / analytics
  // ----------------------------------------------------------
  async stats(query: { type?: ActivityType } = {}) {
    const base: Prisma.ActivityWhereInput = query.type ? { type: query.type } : {};

    const [byType, byStatus, byOutcome, durationAgg] = await Promise.all([
      this.prisma.activity.groupBy({ by: ['type'], where: base, _count: { _all: true } }),
      this.prisma.activity.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
      this.prisma.activity.groupBy({ by: ['outcome'], where: base, _count: { _all: true } }),
      this.prisma.activity.aggregate({ where: base, _sum: { durationSec: true }, _avg: { durationSec: true } }),
    ]);

    const typeCounts: Record<string, number> = {};
    for (const t of byType) typeCounts[t.type] = t._count._all;
    const statusCounts: Record<string, number> = {};
    for (const s of byStatus) statusCounts[s.status] = s._count._all;
    const outcomeCounts: Record<string, number> = {};
    for (const o of byOutcome) if (o.outcome) outcomeCounts[o.outcome] = o._count._all;

    const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);
    const now = new Date();

    const [today, overdue, upcoming, completed] = await Promise.all([
      this.prisma.activity.count({
        where: { ...base, OR: [{ scheduledAt: { gte: startOfToday, lte: endOfToday } }, { dueAt: { gte: startOfToday, lte: endOfToday } }] },
      }),
      this.prisma.activity.count({
        where: { ...base, dueAt: { lt: now }, status: { notIn: COMPLETED_STATES } },
      }),
      this.prisma.activity.count({
        where: { ...base, scheduledAt: { gt: now }, status: { notIn: COMPLETED_STATES } },
      }),
      this.prisma.activity.count({ where: { ...base, status: ActivityStatus.Completed } }),
    ]);

    return {
      total,
      today,
      overdue,
      upcoming,
      completed,
      durationTotalSec: durationAgg._sum.durationSec ?? 0,
      durationAvgSec: Math.round(durationAgg._avg.durationSec ?? 0),
      byType: typeCounts,
      byStatus: statusCounts,
      byOutcome: outcomeCounts,
    };
  }

  // ----------------------------------------------------------
  // Options for forms
  // ----------------------------------------------------------
  async options() {
    const [users, cadres, campaigns, mandals] = await Promise.all([
      this.prisma.user.findMany({
        where: { status: 'Active' },
        select: { id: true, name: true, designation: true },
        orderBy: { name: 'asc' },
        take: 200,
      }),
      this.prisma.cadre.findMany({
        where: { status: 'Active' },
        select: { id: true, name: true, designation: true },
        orderBy: { name: 'asc' },
        take: 200,
      }),
      this.prisma.activityCampaign.findMany({
        select: { id: true, name: true, type: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.mandal.findMany({
        select: { id: true, name: true, constituencyId: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { users, cadres, campaigns, mandals };
  }

  // ----------------------------------------------------------
  // Calendar (activities + events)
  // ----------------------------------------------------------
  async calendar(query: ActivityCalendarQueryDto) {
    const now = new Date();
    const from = toDate(query.from) ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toDate(query.to) ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const where: Prisma.ActivityWhereInput = {
      OR: [
        { scheduledAt: { gte: from, lte: to } },
        { dueAt: { gte: from, lte: to } },
      ],
    };
    if (query.type) where.type = query.type;

    const [activities, events] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          priority: true,
          scheduledAt: true,
          dueAt: true,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 500,
      }),
      query.type
        ? Promise.resolve([])
        : this.prisma.event.findMany({
            where: { startAt: { gte: from, lte: to } },
            select: { id: true, title: true, type: true, status: true, startAt: true },
            orderBy: { startAt: 'asc' },
            take: 500,
          }),
    ]);

    const items = [
      ...activities.map((a) => ({
        id: a.id,
        kind: 'activity' as const,
        title: a.title,
        type: a.type,
        status: a.status,
        priority: a.priority,
        date: (a.scheduledAt ?? a.dueAt)?.toISOString() ?? null,
      })),
      ...(events as { id: string; title: string; type: string; status: string; startAt: Date }[]).map((e) => ({
        id: e.id,
        kind: 'event' as const,
        title: e.title,
        type: e.type,
        status: e.status,
        priority: null,
        date: e.startAt.toISOString(),
      })),
    ].filter((i) => i.date);

    return { from: from.toISOString(), to: to.toISOString(), items };
  }

  // ----------------------------------------------------------
  // Unified timeline (activities + whatsapp)
  // ----------------------------------------------------------
  async timeline(query: ActivityTimelineQueryDto) {
    const limit = query.limit ?? 50;
    const where: Prisma.ActivityWhereInput = {};
    if (query.citizenId) where.citizenId = query.citizenId;
    if (query.cadreId) where.cadreId = query.cadreId;

    const activities = await this.prisma.activity.findMany({
      where,
      include: {
        citizen: { select: { id: true, name: true } },
        cadre: { select: { id: true, name: true } },
        assignedToUser: { select: { id: true, name: true } },
      },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    let waItems: {
      id: string;
      kind: 'whatsapp';
      type: string;
      title: string;
      body: string;
      direction: string;
      date: string;
    }[] = [];
    if (query.citizenId) {
      const messages = await this.prisma.whatsappMessage.findMany({
        where: { conversation: { citizenId: query.citizenId } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, body: true, direction: true, createdAt: true },
      });
      waItems = messages.map((m) => ({
        id: m.id,
        kind: 'whatsapp' as const,
        type: 'WhatsApp',
        title: m.direction === 'Inbound' ? 'WhatsApp received' : 'WhatsApp sent',
        body: m.body,
        direction: m.direction,
        date: m.createdAt.toISOString(),
      }));
    }

    const activityItems = activities.map((a) => ({
      id: a.id,
      kind: 'activity' as const,
      type: a.type,
      title: a.title,
      body: a.description ?? a.outcome ?? '',
      status: a.status,
      direction: a.direction ?? null,
      date: (a.scheduledAt ?? a.startedAt ?? a.createdAt).toISOString(),
    }));

    const items = [...activityItems, ...waItems].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
    return { items };
  }

  // ----------------------------------------------------------
  // Get one
  // ----------------------------------------------------------
  async get(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, mobile: true } },
        cadre: { select: { id: true, name: true, designation: true } },
        official: { select: { id: true, name: true, designation: true, mobile: true } },
        assignedToUser: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true, type: true } },
        event: { select: { id: true, title: true, startAt: true } },
        grievance: { select: { id: true, code: true, title: true, status: true } },
        survey: { select: { id: true, title: true } },
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        booth: { select: { id: true, number: true, name: true } },
        participants: {
          include: {
            citizen: { select: { id: true, name: true } },
            cadre: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
        notes: { orderBy: { createdAt: 'desc' } },
        reminders: { orderBy: { remindAt: 'asc' } },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  // ----------------------------------------------------------
  // Create
  // ----------------------------------------------------------
  async create(dto: CreateActivityDto, user: AuthenticatedUser) {
    const code = await this.nextCode();
    const data = this.buildData(dto);

    const activity = await this.prisma.activity.create({
      data: {
        ...data,
        type: dto.type,
        title: dto.title,
        code,
        createdById: user.id,
        notes: {
          create: {
            action: 'Created',
            toStatus: data.status,
            note: 'Activity logged',
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
      include: listInclude,
    });

    if (activity.reminderAt) {
      await this.prisma.activityReminder.create({
        data: {
          activityId: activity.id,
          remindAt: activity.reminderAt,
          note: `Follow-up: ${activity.title}`,
          forUserId: activity.assignedToUserId ?? user.id,
        },
      });
    }

    if (activity.assignedToUserId && activity.assignedToUserId !== user.id) {
      await this.notify(activity.assignedToUserId, 'Info', 'New activity assigned', activity.title);
    }

    const autoCreateTypes: PrismaActivityType[] = [
      'Call',
      'CampaignCall',
      'ConferenceCall',
      'Email',
      'SmsCampaign',
      'Task',
      'Meeting',
      'FieldVisit',
      'Visit',
    ];
    if (autoCreateTypes.includes(activity.type)) {
      await this.tempGrievances.tryAutoCreateFromActivity(activity.id, user).catch(() => undefined);
    }

    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.ensureExists(id);
    const data = this.buildData(dto);
    const updateData: Prisma.ActivityUpdateInput = { ...data };
    if (dto.title !== undefined) updateData.title = dto.title;
    return this.prisma.activity.update({ where: { id }, data: updateData, include: listInclude });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.activity.delete({ where: { id } });
    return { success: true };
  }

  // ----------------------------------------------------------
  // Status change / completion
  // ----------------------------------------------------------
  async changeStatus(id: string, dto: ChangeActivityStatusDto, user: AuthenticatedUser) {
    const activity = await this.get(id);
    const becomingCompleted =
      dto.status === ActivityStatus.Completed && activity.status !== ActivityStatus.Completed;

    return this.prisma.activity.update({
      where: { id },
      data: {
        status: dto.status,
        completedAt: becomingCompleted ? new Date() : activity.completedAt,
        notes: {
          create: {
            action: 'StatusChange',
            fromStatus: activity.status,
            toStatus: dto.status,
            note: dto.note,
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
      include: listInclude,
    });
  }

  async complete(id: string, dto: CompleteActivityDto, user: AuthenticatedUser) {
    const activity = await this.get(id);
    return this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.Completed,
        completedAt: new Date(),
        outcome: dto.outcome ?? activity.outcome,
        durationSec: dto.durationSec ?? activity.durationSec,
        notes: {
          create: {
            action: 'Completed',
            fromStatus: activity.status,
            toStatus: ActivityStatus.Completed,
            note: dto.note ?? dto.outcome,
            byUserId: user.id,
            byName: user.name,
          },
        },
      },
      include: listInclude,
    });
  }

  // ----------------------------------------------------------
  // Notes / participants / reminders
  // ----------------------------------------------------------
  async addNote(id: string, dto: AddActivityNoteDto, user: AuthenticatedUser) {
    await this.ensureExists(id);
    await this.prisma.activityNote.create({
      data: { activityId: id, action: 'Note', note: dto.note, byUserId: user.id, byName: user.name },
    });
    return this.get(id);
  }

  async addParticipant(id: string, dto: AddParticipantDto) {
    await this.ensureExists(id);
    await this.prisma.activityParticipant.create({
      data: {
        activityId: id,
        name: dto.name,
        mobile: dto.mobile,
        role: dto.role,
        status: dto.status,
        citizenId: dto.citizenId,
        cadreId: dto.cadreId,
        userId: dto.userId,
      },
    });
    return this.get(id);
  }

  async addReminder(id: string, dto: AddReminderDto, user: AuthenticatedUser) {
    const activity = await this.get(id);
    const remindAt = new Date(dto.remindAt);
    await this.prisma.activityReminder.create({
      data: {
        activityId: id,
        remindAt,
        note: dto.note,
        forUserId: dto.forUserId ?? activity.assignedToUserId ?? user.id,
      },
    });
    await this.prisma.activity.update({ where: { id }, data: { reminderAt: remindAt } });
    return this.get(id);
  }

  // ----------------------------------------------------------
  // Campaigns
  // ----------------------------------------------------------
  async listCampaigns(query: CampaignQueryDto) {
    const { page, limit, search } = query;
    const where: Prisma.ActivityCampaignWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.activityCampaign.findMany({
        where,
        include: { mandal: { select: { id: true, name: true } }, _count: { select: { activities: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityCampaign.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.activityCampaign.findUnique({
      where: { id },
      include: {
        mandal: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        _count: { select: { activities: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(dto: CreateCampaignDto, user: AuthenticatedUser) {
    return this.prisma.activityCampaign.create({
      data: {
        name: dto.name,
        type: dto.type,
        status: dto.status,
        description: dto.description,
        script: dto.script,
        startAt: toDate(dto.startAt),
        endAt: toDate(dto.endAt),
        targetCount: dto.targetCount ?? 0,
        budget: dto.budget ?? 0,
        constituencyId: dto.constituencyId,
        mandalId: dto.mandalId,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
        createdById: user.id,
      },
    });
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.getCampaign(id);
    if (dto.recomputeMetrics) {
      return this.recomputeCampaignMetrics(id);
    }
    return this.prisma.activityCampaign.update({
      where: { id },
      data: {
        name: dto.name ?? campaign.name,
        status: dto.status ?? campaign.status,
        description: dto.description,
        script: dto.script,
        startAt: dto.startAt ? toDate(dto.startAt) : campaign.startAt,
        endAt: dto.endAt ? toDate(dto.endAt) : campaign.endAt,
        targetCount: dto.targetCount ?? campaign.targetCount,
        reachedCount: dto.reachedCount ?? campaign.reachedCount,
        responseCount: dto.responseCount ?? campaign.responseCount,
        conversionCount: dto.conversionCount ?? campaign.conversionCount,
        budget: dto.budget ?? campaign.budget,
        spent: dto.spent ?? campaign.spent,
      },
    });
  }

  async campaignMetrics(id: string) {
    const campaign = await this.getCampaign(id);
    const [statusGroups, outcomeGroups, total] = await Promise.all([
      this.prisma.activity.groupBy({ by: ['status'], where: { campaignId: id }, _count: { _all: true } }),
      this.prisma.activity.groupBy({ by: ['outcome'], where: { campaignId: id }, _count: { _all: true } }),
      this.prisma.activity.count({ where: { campaignId: id } }),
    ]);
    const byStatus: Record<string, number> = {};
    for (const s of statusGroups) byStatus[s.status] = s._count._all;
    const byOutcome: Record<string, number> = {};
    for (const o of outcomeGroups) if (o.outcome) byOutcome[o.outcome] = o._count._all;
    const reached = total;
    const conversionRate = campaign.targetCount ? Math.round((campaign.conversionCount / campaign.targetCount) * 100) : 0;
    return { campaign, total, reached, byStatus, byOutcome, conversionRate };
  }

  private async recomputeCampaignMetrics(id: string) {
    const [reached, responses, conversions] = await Promise.all([
      this.prisma.activity.count({ where: { campaignId: id } }),
      this.prisma.activity.count({ where: { campaignId: id, status: { in: [ActivityStatus.Completed, ActivityStatus.FollowUp] } } }),
      this.prisma.activity.count({ where: { campaignId: id, outcome: { in: ['Converted', 'Supportive', 'Interested'] } } }),
    ]);
    return this.prisma.activityCampaign.update({
      where: { id },
      data: { reachedCount: reached, responseCount: responses, conversionCount: conversions },
    });
  }

  // ----------------------------------------------------------
  // Reminders dispatch (cron + fallback endpoint)
  // ----------------------------------------------------------
  async dispatchDueReminders() {
    const now = new Date();
    const due = await this.prisma.activityReminder.findMany({
      where: { sent: false, remindAt: { lte: now } },
      include: { activity: { select: { id: true, title: true, type: true } } },
      take: 100,
    });
    for (const r of due) {
      if (r.forUserId) {
        await this.notify(
          r.forUserId,
          'Warning',
          'Activity reminder',
          r.note ?? `Reminder for: ${r.activity.title}`,
          `/activities/${r.activityId}`,
        );
      }
      await this.prisma.activityReminder.update({
        where: { id: r.id },
        data: { sent: true, sentAt: now },
      });
    }
    return { dispatched: due.length };
  }

  async dueReminders(user: AuthenticatedUser) {
    const now = new Date();
    return this.prisma.activityReminder.findMany({
      where: { sent: false, remindAt: { lte: now }, OR: [{ forUserId: user.id }, { forUserId: null }] },
      include: { activity: { select: { id: true, title: true, type: true, status: true } } },
      orderBy: { remindAt: 'asc' },
      take: 50,
    });
  }

  // ----------------------------------------------------------
  // Reports
  // ----------------------------------------------------------
  reportTypes() {
    return [
      { type: 'daily', label: 'Daily Activities', description: 'All activities created or scheduled today.' },
      { type: 'weekly', label: 'Weekly Activities', description: 'Activities over the last 7 days.' },
      { type: 'monthly', label: 'Monthly Activities', description: 'Activities over the last 30 days.' },
      { type: 'volunteer', label: 'Volunteer Activities', description: 'Volunteer field and outreach activities.' },
      { type: 'cadre', label: 'Cadre Activities', description: 'Cadre-linked activities and attendance.' },
      { type: 'constituency', label: 'Constituency Activities', description: 'All activities grouped by mandal/constituency.' },
      { type: 'campaign', label: 'Campaign Activities', description: 'Campaign calls, SMS, voice and outreach.' },
      { type: 'communication', label: 'Communication Report', description: 'Calls, WhatsApp, emails and conference calls.' },
    ];
  }

  async reportsSummary() {
    const [total, calls, tasks, meetings, campaigns] = await Promise.all([
      this.prisma.activity.count(),
      this.prisma.activity.count({ where: { type: { in: [ActivityType.Call, ActivityType.CampaignCall, ActivityType.ConferenceCall] } } }),
      this.prisma.activity.count({ where: { type: ActivityType.Task } }),
      this.prisma.activity.count({ where: { type: { in: [ActivityType.Meeting, ActivityType.Visit, ActivityType.OfficialMeeting] } } }),
      this.prisma.activityCampaign.count(),
    ]);
    return { counts: { total, calls, tasks, meetings, campaigns }, reports: this.reportTypes() };
  }

  async generateCsv(type: string): Promise<{ filename: string; csv: string; rows: number }> {
    const stamp = new Date().toISOString().slice(0, 10);
    const where = this.reportWhere(type);
    const rows = await this.prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: { select: { name: true } },
        cadre: { select: { name: true } },
        assignedToUser: { select: { name: true } },
        campaign: { select: { name: true } },
        mandal: { select: { name: true } },
      },
    });
    const escape = (v: string | number | null | undefined): string => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fmt = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '');
    const headers = ['Code', 'Type', 'Title', 'Status', 'Priority', 'Direction', 'Outcome', 'Contact', 'Citizen', 'Cadre', 'Assigned To', 'Campaign', 'Mandal', 'Duration(s)', 'Scheduled', 'Completed', 'Created'];
    const head = headers.map(escape).join(',');
    const body = rows
      .map((a) =>
        [
          a.code,
          a.type,
          a.title,
          a.status,
          a.priority,
          a.direction,
          a.outcome,
          a.contactName ?? a.contactMobile,
          a.citizen?.name,
          a.cadre?.name,
          a.assignedToUser?.name,
          a.campaign?.name,
          a.mandal?.name,
          a.durationSec,
          fmt(a.scheduledAt),
          fmt(a.completedAt),
          fmt(a.createdAt),
        ]
          .map(escape)
          .join(','),
      )
      .join('\n');
    return { filename: `activities-${type}-${stamp}.csv`, csv: `${head}\n${body}`, rows: rows.length };
  }

  private reportWhere(type: string): Prisma.ActivityWhereInput {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    switch (type) {
      case 'daily':
        return { createdAt: { gte: startOfToday } };
      case 'weekly':
        return { createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } };
      case 'monthly':
        return { createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } };
      case 'volunteer':
        return { type: { in: [ActivityType.VolunteerActivity, ActivityType.DoorToDoor, ActivityType.FieldVisit] } };
      case 'cadre':
        return { type: ActivityType.CadreActivity };
      case 'constituency':
        return {};
      case 'campaign':
        return { type: { in: [ActivityType.CampaignCall, ActivityType.SmsCampaign, ActivityType.VoiceBroadcast] } };
      case 'communication':
        return { type: { in: [ActivityType.Call, ActivityType.WhatsApp, ActivityType.Email, ActivityType.ConferenceCall] } };
      default:
        return {};
    }
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  private buildData(dto: CreateActivityDto | UpdateActivityDto): Prisma.ActivityUncheckedCreateInput {
    const data: Record<string, unknown> = {
      subType: dto.subType,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      direction: dto.direction,
      outcome: dto.outcome,
      scheduledAt: toDate(dto.scheduledAt),
      startedAt: toDate(dto.startedAt),
      endedAt: toDate(dto.endedAt),
      durationSec: dto.durationSec,
      dueAt: toDate(dto.dueAt),
      reminderAt: toDate(dto.reminderAt),
      recordingUrl: dto.recordingUrl,
      mediaUrls: dto.mediaUrls,
      metadata: dto.metadata,
      contactName: dto.contactName,
      contactMobile: dto.contactMobile,
      locationName: dto.locationName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      campaignId: dto.campaignId,
      citizenId: dto.citizenId,
      cadreId: dto.cadreId,
      officialId: dto.officialId,
      eventId: dto.eventId,
      grievanceId: dto.grievanceId,
      surveyId: dto.surveyId,
      assignedToUserId: dto.assignedToUserId,
      villageId: dto.villageId,
      mandalId: dto.mandalId,
      constituencyId: dto.constituencyId,
      boothId: dto.boothId,
    };
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) delete data[key];
    }
    return data as Prisma.ActivityUncheckedCreateInput;
  }

  private async notify(userId: string, type: 'Info' | 'Warning' | 'Alert' | 'Success', title: string, body?: string, link?: string) {
    await this.prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  }

  private async nextCode() {
    const last = await this.prisma.activity.findFirst({
      where: { code: { startsWith: 'ACT-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    let max = 1000;
    if (last?.code) {
      const num = parseInt(last.code.replace(/\D/g, ''), 10);
      if (!Number.isNaN(num) && num >= max) max = num;
    }
    return `ACT-${max + 1}`;
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.activity.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Activity not found');
  }
}
