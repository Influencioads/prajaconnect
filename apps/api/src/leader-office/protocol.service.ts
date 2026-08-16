import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import type { CreateInvitationDto, InvitationDecisionDto, InvitationQueryDto, UpdateInvitationDto } from './dto/protocol.dto';

const INVITATION_INCLUDE = {
  citizen: { select: { id: true, name: true, mobile: true } },
  representative: { select: { id: true, name: true, mobile: true, designation: true, userId: true } },
} satisfies Prisma.InvitationInclude;

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@Injectable()
export class ProtocolService {
  private readonly logger = new Logger(ProtocolService.name);

  constructor(
    private prisma: PrismaService,
    private dispatch: NotificationDispatchService,
  ) {}

  async list(query: InvitationQueryDto) {
    const { page = 1, limit = 20, search, decision, category, from, to } = query;
    const where: Prisma.InvitationWhereInput = {};
    if (decision) where.decision = decision;
    if (category) where.category = category;
    const gte = toDate(from);
    const lte = toDate(to);
    if (gte || lte) where.eventDate = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
    if (search) {
      where.OR = [
        { eventName: { contains: search, mode: 'insensitive' } },
        { host: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        include: INVITATION_INCLUDE,
        orderBy: { eventDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invitation.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const found = await this.prisma.invitation.findUnique({ where: { id }, include: INVITATION_INCLUDE });
    if (!found) throw new NotFoundException('Invitation not found');
    return found;
  }

  async create(body: CreateInvitationDto, userId?: string) {
    const eventDate = toDate(body.eventDate);
    if (!eventDate) throw new BadRequestException('eventDate is invalid');
    return this.prisma.invitation.create({
      data: {
        eventName: body.eventName,
        host: body.host,
        citizenId: body.citizenId,
        eventDate,
        venue: body.venue,
        cardPhotoUrl: body.cardPhotoUrl,
        category: body.category ?? 'Other',
        giftNotes: body.giftNotes,
        notes: body.notes,
        createdBy: userId,
      },
      include: INVITATION_INCLUDE,
    });
  }

  async update(id: string, body: UpdateInvitationDto) {
    await this.get(id);
    return this.prisma.invitation.update({
      where: { id },
      data: {
        eventName: body.eventName,
        host: body.host,
        citizenId: body.citizenId,
        eventDate: body.eventDate !== undefined ? toDate(body.eventDate) : undefined,
        venue: body.venue,
        cardPhotoUrl: body.cardPhotoUrl,
        category: body.category,
        giftNotes: body.giftNotes,
        notes: body.notes,
      },
      include: INVITATION_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.get(id);
    return this.prisma.invitation.delete({ where: { id } });
  }

  /** Month grid data: ?month=YYYY-MM (defaults to current month). */
  async calendar(month?: string) {
    const now = new Date();
    const match = /^(\d{4})-(\d{2})$/.exec(month ?? '');
    const year = match ? Number(match[1]) : now.getFullYear();
    const monthIndex = match ? Number(match[2]) - 1 : now.getMonth();
    const from = new Date(year, monthIndex, 1);
    const to = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    const invitations = await this.prisma.invitation.findMany({
      where: { eventDate: { gte: from, lte: to } },
      include: INVITATION_INCLUDE,
      orderBy: { eventDate: 'asc' },
      take: 500,
    });

    const days: Record<string, typeof invitations> = {};
    for (const inv of invitations) {
      const key = inv.eventDate.toISOString().slice(0, 10);
      (days[key] ??= []).push(inv);
    }

    return {
      month: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      from: from.toISOString(),
      to: to.toISOString(),
      total: invitations.length,
      days: Object.entries(days).map(([date, items]) => ({ date, items })),
    };
  }

  async decide(id: string, body: InvitationDecisionDto, userId?: string) {
    const invitation = await this.get(id);
    const decision = body.decision;
    const data: Prisma.InvitationUpdateInput = { decision, notes: body.notes ?? invitation.notes };
    if (body.giftNotes !== undefined) data.giftNotes = body.giftNotes;

    let outcome: Record<string, unknown> = { decision };

    if (decision === 'Attend') {
      const startAt = invitation.eventDate;
      const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
      const block = await this.prisma.leaderScheduleBlock.create({
        data: { title: `${invitation.category}: ${invitation.eventName} (${invitation.host})`, startAt, endAt },
      });
      outcome = { decision, scheduleBlockId: block.id };
    } else if (decision === 'SendRepresentative') {
      if (!body.cadreId) throw new BadRequestException('cadreId is required to send a representative');
      const cadre = await this.prisma.cadre.findUnique({
        where: { id: body.cadreId },
        select: { id: true, name: true, userId: true },
      });
      if (!cadre) throw new NotFoundException('Cadre not found');
      data.representative = { connect: { id: cadre.id } };
      if (cadre.userId) {
        await this.dispatch.dispatch({
          userId: cadre.userId,
          title: `Represent the leader — ${invitation.eventName}`,
          body: [
            `Host: ${invitation.host}`,
            `When: ${invitation.eventDate.toLocaleString()}`,
            invitation.venue ? `Venue: ${invitation.venue}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          type: 'Info',
          link: '/protocol',
          channels: ['inapp', 'push'],
          data: { invitationId: invitation.id },
        });
        outcome = { decision, notified: cadre.id };
      } else {
        this.logger.warn(`Cadre ${cadre.id} has no linked user account — no in-app notification sent`);
        outcome = { decision, notified: null, reason: 'cadre has no linked user account' };
      }
    } else if (decision === 'SendWishes') {
      const mobile = invitation.citizen?.mobile ?? null;
      const message = `Warm wishes to ${invitation.host} on ${invitation.eventName}.`;
      if (mobile) {
        const result = await this.dispatch.dispatch({
          userId,
          title: `Wishes sent — ${invitation.eventName}`,
          body: message,
          type: 'Info',
          channels: ['whatsapp', 'sms'],
          whatsappTo: mobile,
          smsTo: mobile,
        });
        data.wishSent = true;
        outcome = { decision, sentTo: mobile, channels: result };
      } else {
        this.logger.log(`Invitation ${invitation.id}: no host mobile on file — flagged for office follow-up`);
        data.wishSent = false;
        data.notes = [body.notes ?? invitation.notes, 'Office follow-up: no host mobile on file for wishes']
          .filter(Boolean)
          .join(' | ');
        outcome = { decision, sentTo: null, reason: 'no host mobile — marked for office follow-up' };
      }
    }

    const updated = await this.prisma.invitation.update({ where: { id }, data, include: INVITATION_INCLUDE });
    return { invitation: updated, outcome };
  }
}
