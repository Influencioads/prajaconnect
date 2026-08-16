import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { NotificationType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { DispatchChannel, NotificationDispatchService } from '../notifications/dispatch.service';

const MS_PER_DAY = 86400000;
const MS_PER_HOUR = 3600000;
const AT_RISK_FRACTION = 0.8;
const DARK_ZONE_DAYS = 14;
const RESOLUTION_ACTIVE_STATUSES = ['Open', 'Assigned', 'InProgress', 'Escalated'] as const;

export interface SlaListItem {
  id: string;
  code: string;
  title: string;
  priority: string;
  status: string;
  slaDueAt: Date;
  mandal: string | null;
  assignee: string | null;
  hoursLeft?: number;
  daysOverdue?: number;
  escalationLevel?: number;
}

export interface InactiveCadreItem {
  id: string;
  name: string;
  designation: string;
  mobile: string;
  level: string;
  mandal: string | null;
  booth: string | null;
  parentName: string | null;
  parentUserId: string | null;
}

interface SlaGrievanceRow {
  id: string;
  code: string;
  title: string;
  departmentId: string | null;
  assignedOfficial: { id: string; name: string; mobile: string | null; email: string | null } | null;
  assignedCadre: { id: string; name: string; mobile: string; userId: string | null } | null;
}

@Injectable()
export class OpsAlertsService {
  private readonly logger = new Logger(OpsAlertsService.name);

  constructor(
    private prisma: PrismaService,
    private dispatch: NotificationDispatchService,
  ) {}

  // ----- Config (Setting table, code defaults) -----
  private async setting(key: string): Promise<string | null> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  async isEnabled(): Promise<boolean> {
    const val = await this.setting('ops_alerts_enabled');
    if (val === null) return true;
    return val !== 'false' && val !== '0';
  }

  async inactiveCadreDays(): Promise<number> {
    const val = await this.setting('ops_inactive_cadre_days');
    const n = val ? parseInt(val, 10) : 3;
    return Number.isFinite(n) && n > 0 ? n : 3;
  }

  private async smsEnabled(): Promise<boolean> {
    return (await this.setting('notify_sms')) === 'true';
  }

  // ============================================================
  // 1. SLA at-risk / breach escalation
  // ============================================================

  private async fetchActiveSlaGrievances() {
    return this.prisma.grievance.findMany({
      where: {
        status: { in: [...RESOLUTION_ACTIVE_STATUSES] },
        slaDueAt: { not: null },
      },
      select: {
        id: true,
        code: true,
        title: true,
        priority: true,
        status: true,
        slaDueAt: true,
        slaDays: true,
        createdAt: true,
        departmentId: true,
        mandal: { select: { name: true } },
        assignedOfficial: { select: { id: true, name: true, mobile: true, email: true } },
        assignedCadre: { select: { id: true, name: true, mobile: true, userId: true } },
        slaWarnings: { select: { kind: true, level: true } },
      },
    });
  }

  /** SLA window start, from the same fields the SLA cron uses (slaDueAt/slaDays). */
  private slaStart(g: { slaDueAt: Date | null; slaDays: number | null; createdAt: Date }): Date {
    if (g.slaDays && g.slaDays > 0) return new Date(g.slaDueAt!.getTime() - g.slaDays * MS_PER_DAY);
    return g.createdAt;
  }

  private atRiskAt(g: { slaDueAt: Date | null; slaDays: number | null; createdAt: Date }): Date {
    const start = this.slaStart(g).getTime();
    const due = g.slaDueAt!.getTime();
    return new Date(start + AT_RISK_FRACTION * Math.max(0, due - start));
  }

  /** GET /ops-alerts/sla — current at-risk + breached list with escalation level. */
  async slaOverview() {
    const now = new Date();
    const rows = await this.fetchActiveSlaGrievances();
    const atRisk: SlaListItem[] = [];
    const breached: SlaListItem[] = [];

    for (const g of rows) {
      const dueAt = g.slaDueAt!;
      const base: SlaListItem = {
        id: g.id,
        code: g.code,
        title: g.title,
        priority: g.priority,
        status: g.status,
        slaDueAt: dueAt,
        mandal: g.mandal?.name ?? null,
        assignee: g.assignedOfficial?.name ?? g.assignedCadre?.name ?? null,
      };
      if (dueAt > now) {
        if (now >= this.atRiskAt(g)) {
          atRisk.push({
            ...base,
            hoursLeft: Math.max(1, Math.round((dueAt.getTime() - now.getTime()) / MS_PER_HOUR)),
          });
        }
      } else {
        breached.push({
          ...base,
          daysOverdue: Math.max(1, Math.ceil((now.getTime() - dueAt.getTime()) / MS_PER_DAY)),
          escalationLevel: g.slaWarnings
            .filter((w) => w.kind === 'Escalated')
            .reduce((m, w) => Math.max(m, w.level), 0),
        });
      }
    }

    atRisk.sort((a, b) => (a.hoursLeft ?? 0) - (b.hoursLeft ?? 0));
    breached.sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));
    return { atRisk, breached, counts: { atRisk: atRisk.length, breached: breached.length } };
  }

  /** Hourly scan (called from the existing grievance SLA cron). Idempotent via SlaWarning. */
  async runSlaEscalationScan() {
    const now = new Date();
    const smsOk = await this.smsEnabled();
    const rows = await this.fetchActiveSlaGrievances();
    let atRiskSent = 0;
    let breachSent = 0;
    let escalated = 0;

    for (const g of rows) {
      const dueAt = g.slaDueAt!;
      const has = (kind: string, level = 0) =>
        g.slaWarnings.some((w) => w.kind === kind && w.level >= level);

      if (dueAt > now) {
        if (now >= this.atRiskAt(g) && !has('AtRisk')) {
          const sent = await this.notifyAssignee(g, smsOk, {
            type: NotificationType.Warning,
            title: `SLA at risk: ${g.code}`,
            body: `${g.title} has used 80% of its resolution SLA (due ${dueAt.toISOString().slice(0, 10)}).`,
          });
          await this.prisma.slaWarning.create({
            data: { grievanceId: g.id, kind: 'AtRisk', level: 0, notifiedUserIds: sent },
          });
          atRiskSent += 1;
        }
        continue;
      }

      if (!has('Breach')) {
        const sent = await this.notifyAssignee(g, smsOk, {
          type: NotificationType.Alert,
          title: `SLA breached: ${g.code}`,
          body: `${g.title} is past its resolution SLA and remains unresolved.`,
        });
        await this.prisma.slaWarning.create({
          data: { grievanceId: g.id, kind: 'Breach', level: 0, notifiedUserIds: sent },
        });
        breachSent += 1;
      }

      // One escalation level up the directory matrix per 24h unresolved after breach.
      const level = Math.floor((now.getTime() - dueAt.getTime()) / MS_PER_DAY);
      if (level >= 1 && !has('Escalated', level)) {
        const sent = await this.escalateToMatrix(g, level, smsOk);
        await this.prisma.slaWarning.create({
          data: { grievanceId: g.id, kind: 'Escalated', level, notifiedUserIds: sent },
        });
        escalated += 1;
      }
    }

    return { atRisk: atRiskSent, breached: breachSent, escalated };
  }

  private async notifyAssignee(
    g: SlaGrievanceRow,
    smsOk: boolean,
    msg: { type: NotificationType; title: string; body: string },
  ): Promise<string[]> {
    const userId = g.assignedCadre?.userId;
    if (!userId) {
      this.logger.log(`Grievance ${g.code}: assignee has no linked user, skipping SLA warning dispatch`);
      return [];
    }
    const smsTo = g.assignedCadre?.mobile ?? g.assignedOfficial?.mobile ?? undefined;
    const channels: DispatchChannel[] = ['push'];
    if (smsOk && smsTo) channels.push('sms');
    await this.dispatch.dispatch({
      userIds: [userId],
      type: msg.type,
      title: msg.title,
      body: msg.body,
      link: '/ops-alerts',
      channels,
      smsTo: smsOk ? smsTo : undefined,
    });
    return [userId];
  }

  /** Walk the directory escalation matrix (department officials by escalationOrder). */
  private async escalateToMatrix(g: SlaGrievanceRow, level: number, smsOk: boolean): Promise<string[]> {
    if (!g.departmentId) {
      this.logger.log(`Grievance ${g.code}: no department, cannot escalate (level ${level})`);
      return [];
    }
    const officials = await this.prisma.governmentOfficial.findMany({
      where: { departmentId: g.departmentId },
      orderBy: [{ escalationOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, mobile: true, email: true },
    });
    if (!officials.length) {
      this.logger.log(`Grievance ${g.code}: department has no officials, cannot escalate (level ${level})`);
      return [];
    }
    const baseIdx = officials.findIndex((o) => o.id === g.assignedOfficial?.id);
    const target = officials[Math.min(Math.max(0, baseIdx + level), officials.length - 1)];

    const or: Prisma.UserWhereInput[] = [];
    if (target.mobile) or.push({ mobile: target.mobile });
    if (target.email) or.push({ email: target.email });
    const user = or.length
      ? await this.prisma.user.findFirst({ where: { OR: or }, select: { id: true } })
      : null;
    if (!user) {
      this.logger.log(
        `Grievance ${g.code}: escalated to ${target.name} at level ${level} (no linked user, recorded only)`,
      );
      return [];
    }

    const channels: DispatchChannel[] = ['push'];
    if (smsOk && target.mobile) channels.push('sms');
    await this.dispatch.dispatch({
      userIds: [user.id],
      type: NotificationType.Alert,
      title: `Escalation L${level}: ${g.code}`,
      body: `${g.title} breached its SLA over ${level * 24}h ago and is escalated to ${target.name}.`,
      link: '/ops-alerts',
      channels,
      smsTo: smsOk ? target.mobile ?? undefined : undefined,
    });
    return [user.id];
  }

  // ============================================================
  // 2. Inactive cadre & dark zones
  // ============================================================

  async inactiveCadre(days?: number) {
    const n = days && days > 0 ? days : await this.inactiveCadreDays();
    const since = new Date(Date.now() - n * MS_PER_DAY);
    // ponytail: in-memory filter over all active cadre; fine at constituency scale.
    const cadres = await this.prisma.cadre.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        name: true,
        designation: true,
        mobile: true,
        level: true,
        mandal: { select: { name: true } },
        booth: { select: { number: true } },
        parent: { select: { id: true, name: true, userId: true } },
        _count: {
          select: {
            volunteerAttendances: { where: { checkInAt: { gte: since } } },
            activities: { where: { createdAt: { gte: since } } },
            d2dResponses: { where: { submittedAt: { gte: since } } },
          },
        },
      },
    });
    const data: InactiveCadreItem[] = cadres
      .filter(
        (c) =>
          c._count.volunteerAttendances === 0 &&
          c._count.activities === 0 &&
          c._count.d2dResponses === 0,
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        designation: c.designation,
        mobile: c.mobile,
        level: c.level,
        mandal: c.mandal?.name ?? null,
        booth: c.booth?.number ?? null,
        parentName: c.parent?.name ?? null,
        parentUserId: c.parent?.userId ?? null,
      }));
    return { days: n, count: data.length, data };
  }

  async darkZones() {
    const since = new Date(Date.now() - DARK_ZONE_DAYS * MS_PER_DAY);
    const [activities, d2d, attendance, villages, booths] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          createdAt: { gte: since },
          OR: [{ villageId: { not: null } }, { boothId: { not: null } }],
        },
        select: { villageId: true, boothId: true },
      }),
      this.prisma.d2DSurveyResponse.findMany({
        where: { submittedAt: { gte: since }, householdId: { not: null } },
        select: { household: { select: { villageId: true, boothId: true } } },
      }),
      this.prisma.volunteerAttendance.findMany({
        where: { checkInAt: { gte: since } },
        select: { cadre: { select: { boothId: true, booth: { select: { villageId: true } } } } },
      }),
      this.prisma.village.findMany({
        select: { id: true, name: true, mandal: { select: { name: true } } },
      }),
      this.prisma.booth.findMany({
        select: { id: true, number: true, name: true, village: { select: { name: true } } },
      }),
    ]);

    const touchedVillages = new Set<string>();
    const touchedBooths = new Set<string>();
    for (const a of activities) {
      if (a.villageId) touchedVillages.add(a.villageId);
      if (a.boothId) touchedBooths.add(a.boothId);
    }
    for (const r of d2d) {
      if (r.household?.villageId) touchedVillages.add(r.household.villageId);
      if (r.household?.boothId) touchedBooths.add(r.household.boothId);
    }
    for (const t of attendance) {
      if (t.cadre.boothId) touchedBooths.add(t.cadre.boothId);
      const villageId = t.cadre.booth?.villageId;
      if (villageId) touchedVillages.add(villageId);
    }

    const darkVillages = villages
      .filter((v) => !touchedVillages.has(v.id))
      .map((v) => ({ id: v.id, name: v.name, mandal: v.mandal?.name ?? null }));
    const darkBooths = booths
      .filter((b) => !touchedBooths.has(b.id))
      .map((b) => ({
        id: b.id,
        number: b.number,
        name: b.name ?? `Booth ${b.number}`,
        village: b.village?.name ?? null,
      }));

    return {
      days: DARK_ZONE_DAYS,
      villages: darkVillages,
      booths: darkBooths,
      counts: { villages: darkVillages.length, booths: darkBooths.length },
    };
  }

  /** Daily 06:30 run: notify reporting parents + persist snapshot. */
  async runDailyScan() {
    const [inactive, dark, sla] = await Promise.all([
      this.inactiveCadre(),
      this.darkZones(),
      this.slaOverview(),
    ]);

    const byParent = new Map<string, InactiveCadreItem[]>();
    for (const c of inactive.data) {
      if (!c.parentUserId) continue;
      const list = byParent.get(c.parentUserId) ?? [];
      list.push(c);
      byParent.set(c.parentUserId, list);
    }
    for (const [parentUserId, list] of byParent) {
      await this.dispatch.dispatch({
        userIds: [parentUserId],
        type: NotificationType.Warning,
        title: `${list.length} inactive cadre in your team`,
        body: `${list.map((c) => c.name).slice(0, 5).join(', ')}${list.length > 5 ? ` +${list.length - 5} more` : ''} had no field activity in the last ${inactive.days} day(s).`,
        link: '/ops-alerts',
        channels: ['push'],
      });
    }

    const today = new Date(new Date().toISOString().slice(0, 10));
    const snapshotData = {
      inactiveCadre: inactive.data as unknown as Prisma.InputJsonValue,
      darkZones: {
        villages: dark.villages,
        booths: dark.booths,
      } as unknown as Prisma.InputJsonValue,
      slaAtRisk: sla.counts.atRisk,
      slaBreached: sla.counts.breached,
    };
    const snapshot = await this.prisma.opsDailySnapshot.upsert({
      where: { date: today },
      update: snapshotData,
      create: { date: today, ...snapshotData },
    });

    return {
      snapshotId: snapshot.id,
      date: snapshot.date,
      inactiveCadre: inactive.count,
      darkVillages: dark.counts.villages,
      darkBooths: dark.counts.booths,
      parentsNotified: byParent.size,
      slaAtRisk: sla.counts.atRisk,
      slaBreached: sla.counts.breached,
    };
  }

  async latestSnapshot() {
    return this.prisma.opsDailySnapshot.findFirst({ orderBy: { date: 'desc' } });
  }
}
