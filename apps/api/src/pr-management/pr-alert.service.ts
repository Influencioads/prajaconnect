import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MediaResponseStatus, PrAlertSeverity, PrAlertStatus, PrAlertType } from '@praja/database';
import { NotificationType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { PrConfigService } from './pr-config.service';
import { MediaService } from '../media/media.service';

type CreateAlertInput = {
  type: PrAlertType;
  severity: PrAlertSeverity;
  title: string;
  body?: string;
  linkedArticleId?: string;
  linkedAttackId?: string;
  dedupeKey?: string;
  notifyAdmin?: boolean;
};

@Injectable()
export class PrAlertService {
  private readonly logger = new Logger(PrAlertService.name);

  constructor(
    private prisma: PrismaService,
    private config: PrConfigService,
    private media: MediaService,
  ) {}

  async createAlert(input: CreateAlertInput) {
    if (input.dedupeKey) {
      const existing = await this.prisma.prAlert.findUnique({
        where: { dedupeKey: input.dedupeKey },
      });
      if (existing && existing.status !== PrAlertStatus.Resolved) {
        return existing;
      }
    }

    const alert = await this.prisma.prAlert.create({
      data: {
        type: input.type,
        severity: input.severity,
        title: input.title,
        body: input.body,
        linkedArticleId: input.linkedArticleId,
        linkedAttackId: input.linkedAttackId,
        dedupeKey: input.dedupeKey,
      },
    });

    if (input.notifyAdmin) {
      await this.notifySuperAdmins(alert.title, alert.body ?? undefined, `/media/pr/alerts?highlight=${alert.id}`);
    }

    return alert;
  }

  async notifySuperAdmins(title: string, body?: string, link?: string) {
    const admins = await this.prisma.user.findMany({
      where: { role: { name: 'SuperAdmin' }, status: 'Active' },
      select: { id: true },
      take: 20,
    });

    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: NotificationType.Alert,
          title,
          body,
          link,
        },
      });
    }
  }

  async scanTimelineViolations() {
    const slaHours = await this.config.responseSlaHours();
    const cutoff = new Date(Date.now() - slaHours * 60 * 60 * 1000);
    let created = 0;

    const pendingAttacks = await this.prisma.oppositionAttack.findMany({
      where: { responseStatus: 'Pending', createdAt: { lt: cutoff } },
    });

    for (const attack of pendingAttacks) {
      const alert = await this.createAlert({
        type: PrAlertType.TimelineViolation,
        severity: PrAlertSeverity.High,
        title: `PR response SLA breached: ${attack.title.slice(0, 80)}`,
        body: `Opposition attack pending response for over ${slaHours} hours.`,
        linkedAttackId: attack.id,
        linkedArticleId: attack.articleId ?? undefined,
        dedupeKey: `timeline-violation-attack-${attack.id}`,
        notifyAdmin: true,
      });
      if (alert.createdAt.getTime() > Date.now() - 5000) created += 1;
    }

    const draftResponses = await this.prisma.mediaResponse.findMany({
      where: {
        status: MediaResponseStatus.Draft,
        createdAt: { lt: cutoff },
        attack: { responseStatus: 'Pending' },
      },
      include: { attack: true },
    });

    for (const response of draftResponses) {
      const alert = await this.createAlert({
        type: PrAlertType.TimelineViolation,
        severity: PrAlertSeverity.Medium,
        title: `Draft response overdue: ${response.attack.title.slice(0, 80)}`,
        body: `Media response draft has not been submitted for over ${slaHours} hours.`,
        linkedAttackId: response.attackId,
        linkedArticleId: response.attack.articleId ?? undefined,
        dedupeKey: `timeline-violation-response-${response.id}`,
        notifyAdmin: false,
      });
      if (alert.createdAt.getTime() > Date.now() - 5000) created += 1;
    }

    return created;
  }

  async checkReputationDrop() {
    const previous = await this.prisma.reputationScoreSnapshot.findFirst({
      orderBy: { date: 'desc' },
      skip: 1,
    });
    const latestBefore = previous?.score ?? null;

    const snapshot = await this.media.computeReputationScore();
    if (latestBefore === null) return null;

    const drop = latestBefore - snapshot.score;
    if (drop > 10) {
      return this.createAlert({
        type: PrAlertType.ReputationDrop,
        severity: drop > 20 ? PrAlertSeverity.Critical : PrAlertSeverity.High,
        title: `Reputation score dropped by ${Math.round(drop)} points`,
        body: `Score moved from ${Math.round(latestBefore)} to ${Math.round(snapshot.score)}.`,
        dedupeKey: `reputation-drop-${new Date().toISOString().slice(0, 10)}`,
        notifyAdmin: true,
      });
    }

    return null;
  }

  async acknowledge(id: string, userId: string) {
    const alert = await this.prisma.prAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.prAlert.update({
      where: { id },
      data: {
        status: PrAlertStatus.Acknowledged,
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
    });
  }

  async resolve(id: string) {
    const alert = await this.prisma.prAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.prAlert.update({
      where: { id },
      data: { status: PrAlertStatus.Resolved },
    });
  }

  async countOpenCritical() {
    return this.prisma.prAlert.count({
      where: {
        status: PrAlertStatus.Open,
        severity: { in: [PrAlertSeverity.High, PrAlertSeverity.Critical] },
      },
    });
  }

  async countSlaBreaches() {
    const slaHours = await this.config.responseSlaHours();
    const cutoff = new Date(Date.now() - slaHours * 60 * 60 * 1000);
    return this.prisma.oppositionAttack.count({
      where: { responseStatus: 'Pending', createdAt: { lt: cutoff } },
    });
  }
}
