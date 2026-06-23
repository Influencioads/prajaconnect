import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMode } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import {
  CommunicationQueryDto,
  CreateCommunicationDto,
  CreateDonationDto,
  CreateDonorDto,
  CreateEventDto,
  CreateFollowUpDto,
  DonationQueryDto,
  FollowUpQueryDto,
  UpdateCommunicationDto,
  UpdateDonationDto,
  UpdateDonorDto,
  UpdateEventDto,
  UpdateFollowUpDto,
} from './dto/fundraising.dto';

@Injectable()
export class FundraisingService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [totalDonors, donationAgg, pendingFollowUps, recentDonations, topDonors, events] =
      await Promise.all([
        this.prisma.donor.count(),
        this.prisma.donation.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
        this.prisma.donorFollowUp.count({
          where: { completed: false, dueDate: { lte: new Date() } },
        }),
        this.prisma.donation.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            donor: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
            receipt: { select: { receiptNo: true } },
          },
        }),
        this.prisma.donation.groupBy({
          by: ['donorId'],
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 5,
        }),
        this.prisma.fundraisingEvent.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { donations: true } },
            donations: { select: { amount: true } },
          },
        }),
      ]);

    const donorIds = topDonors.map((d) => d.donorId);
    const donors = await this.prisma.donor.findMany({
      where: { id: { in: donorIds } },
      select: { id: true, name: true },
    });
    const donorMap = new Map(donors.map((d) => [d.id, d]));

    const upcomingReminders = await this.prisma.donorFollowUp.findMany({
      where: { completed: false, dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { donor: { select: { id: true, name: true } } },
    });

    return {
      totalDonors,
      totalDonations: donationAgg._count._all,
      totalAmount: donationAgg._sum.amount ?? 0,
      pendingFollowUps,
      recentDonations,
      topDonors: topDonors.map((d) => ({
        donor: donorMap.get(d.donorId),
        totalAmount: d._sum.amount ?? 0,
      })),
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        eventDate: e.eventDate,
        targetAmount: e.targetAmount,
        donationCount: e._count.donations,
        raisedAmount: e.donations.reduce((sum, d) => sum + d.amount, 0),
      })),
      upcomingReminders,
    };
  }

  async listDonors(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { mobile: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.donor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { donations: true, followUps: true } },
          donations: { select: { amount: true } },
        },
      }),
      this.prisma.donor.count({ where }),
    ]);

    return {
      data: data.map((d) => ({
        ...d,
        totalDonated: d.donations.reduce((sum, x) => sum + x.amount, 0),
        donations: undefined,
      })),
      meta: paginate(page, limit, total),
    };
  }

  async getDonor(id: string) {
    const donor = await this.prisma.donor.findUnique({
      where: { id },
      include: {
        donations: {
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { id: true, name: true } },
            receipt: { select: { receiptNo: true, issuedAt: true } },
          },
        },
        followUps: { orderBy: { dueDate: 'asc' } },
        communications: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { donations: true, followUps: true, communications: true } },
      },
    });
    if (!donor) throw new NotFoundException('Donor not found');

    const totalDonated = donor.donations.reduce((sum, d) => sum + d.amount, 0);
    return { ...donor, totalDonated };
  }

  async createDonor(body: CreateDonorDto) {
    return this.prisma.donor.create({ data: body });
  }

  async updateDonor(id: string, body: UpdateDonorDto) {
    const existing = await this.prisma.donor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Donor not found');
    return this.prisma.donor.update({ where: { id }, data: body });
  }

  async listDonations(query: DonationQueryDto) {
    const { page, limit, donorId, eventId } = query;
    const where = {
      ...(donorId ? { donorId } : {}),
      ...(eventId ? { eventId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          donor: { select: { id: true, name: true, mobile: true } },
          event: { select: { id: true, name: true } },
          receipt: { select: { receiptNo: true, issuedAt: true } },
        },
      }),
      this.prisma.donation.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getDonation(id: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        donor: true,
        event: true,
        receipt: true,
      },
    });
    if (!donation) throw new NotFoundException('Donation not found');
    return donation;
  }

  async createDonation(body: CreateDonationDto) {
    const donor = await this.prisma.donor.findUnique({ where: { id: body.donorId } });
    if (!donor) throw new NotFoundException('Donor not found');

    return this.prisma.donation.create({
      data: {
        donorId: body.donorId,
        amount: body.amount,
        paymentMode: body.paymentMode ?? PaymentMode.Cash,
        eventId: body.eventId,
        notes: body.notes,
      },
      include: {
        donor: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    });
  }

  async updateDonation(id: string, body: UpdateDonationDto) {
    const existing = await this.prisma.donation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Donation not found');

    return this.prisma.donation.update({
      where: { id },
      data: {
        amount: body.amount,
        paymentMode: body.paymentMode,
        eventId: body.eventId,
        notes: body.notes,
      },
      include: {
        donor: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
        receipt: true,
      },
    });
  }

  async issueReceipt(donationId: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: { receipt: true, donor: true, event: true },
    });
    if (!donation) throw new NotFoundException('Donation not found');
    if (donation.receipt) {
      throw new BadRequestException('Receipt already issued for this donation');
    }

    const receiptNo = await this.nextReceiptNo();

    const receipt = await this.prisma.donationReceipt.create({
      data: { donationId, receiptNo },
    });

    return { ...receipt, donation };
  }

  private async nextReceiptNo(): Promise<string> {
    const last = await this.prisma.donationReceipt.findFirst({
      orderBy: { issuedAt: 'desc' },
      select: { receiptNo: true },
    });
    const match = last?.receiptNo.match(/RCP-(\d+)/);
    const next = match ? parseInt(match[1], 10) + 1 : 1001;
    return `RCP-${next}`;
  }

  async listEvents(query: PaginationDto) {
    const { page, limit, search } = query;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.fundraisingEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { donations: true } },
          donations: { select: { amount: true } },
        },
      }),
      this.prisma.fundraisingEvent.count({ where }),
    ]);

    const data = rows.map((e) => ({
      id: e.id,
      name: e.name,
      eventDate: e.eventDate,
      targetAmount: e.targetAmount,
      createdAt: e.createdAt,
      donationCount: e._count.donations,
      raisedAmount: e.donations.reduce((sum, d) => sum + d.amount, 0),
    }));

    return { data, meta: paginate(page, limit, total) };
  }

  async getEvent(id: string) {
    const event = await this.prisma.fundraisingEvent.findUnique({
      where: { id },
      include: {
        donations: {
          orderBy: { createdAt: 'desc' },
          include: {
            donor: { select: { id: true, name: true } },
            receipt: { select: { receiptNo: true } },
          },
        },
        _count: { select: { donations: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const raisedAmount = event.donations.reduce((sum, d) => sum + d.amount, 0);
    return { ...event, raisedAmount };
  }

  async createEvent(body: CreateEventDto) {
    return this.prisma.fundraisingEvent.create({
      data: {
        name: body.name,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        targetAmount: body.targetAmount ?? 0,
      },
    });
  }

  async updateEvent(id: string, body: UpdateEventDto) {
    const existing = await this.prisma.fundraisingEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Event not found');

    return this.prisma.fundraisingEvent.update({
      where: { id },
      data: {
        name: body.name,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        targetAmount: body.targetAmount,
      },
    });
  }

  async removeEvent(id: string) {
    const existing = await this.prisma.fundraisingEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Event not found');
    await this.prisma.fundraisingEvent.delete({ where: { id } });
    return { ok: true };
  }

  async listFollowUps(query: FollowUpQueryDto) {
    const { page, limit, donorId, completed } = query;
    const where = {
      ...(donorId ? { donorId } : {}),
      ...(completed !== undefined ? { completed } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.donorFollowUp.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { donor: { select: { id: true, name: true, mobile: true } } },
      }),
      this.prisma.donorFollowUp.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listFollowUpReminders() {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [overdue, upcoming] = await Promise.all([
      this.prisma.donorFollowUp.findMany({
        where: { completed: false, dueDate: { lt: now } },
        orderBy: { dueDate: 'asc' },
        take: 50,
        include: { donor: { select: { id: true, name: true, mobile: true } } },
      }),
      this.prisma.donorFollowUp.findMany({
        where: { completed: false, dueDate: { gte: now, lte: weekAhead } },
        orderBy: { dueDate: 'asc' },
        take: 50,
        include: { donor: { select: { id: true, name: true, mobile: true } } },
      }),
    ]);

    return { overdue, upcoming };
  }

  async getFollowUp(id: string) {
    const followUp = await this.prisma.donorFollowUp.findUnique({
      where: { id },
      include: { donor: true },
    });
    if (!followUp) throw new NotFoundException('Follow-up not found');
    return followUp;
  }

  async createFollowUp(body: CreateFollowUpDto) {
    const donor = await this.prisma.donor.findUnique({ where: { id: body.donorId } });
    if (!donor) throw new NotFoundException('Donor not found');

    return this.prisma.donorFollowUp.create({
      data: {
        donorId: body.donorId,
        dueDate: new Date(body.dueDate),
        notes: body.notes,
      },
      include: { donor: { select: { id: true, name: true } } },
    });
  }

  async updateFollowUp(id: string, body: UpdateFollowUpDto) {
    const existing = await this.prisma.donorFollowUp.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Follow-up not found');

    return this.prisma.donorFollowUp.update({
      where: { id },
      data: {
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes,
        completed: body.completed,
      },
      include: { donor: { select: { id: true, name: true } } },
    });
  }

  async removeFollowUp(id: string) {
    const existing = await this.prisma.donorFollowUp.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Follow-up not found');
    await this.prisma.donorFollowUp.delete({ where: { id } });
    return { ok: true };
  }

  async listCommunications(query: CommunicationQueryDto) {
    const { page, limit, donorId } = query;
    const where = donorId ? { donorId } : {};

    const [data, total] = await Promise.all([
      this.prisma.donorCommunicationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { donor: { select: { id: true, name: true } } },
      }),
      this.prisma.donorCommunicationLog.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getCommunication(id: string) {
    const log = await this.prisma.donorCommunicationLog.findUnique({
      where: { id },
      include: { donor: true },
    });
    if (!log) throw new NotFoundException('Communication log not found');
    return log;
  }

  async createCommunication(body: CreateCommunicationDto) {
    const donor = await this.prisma.donor.findUnique({ where: { id: body.donorId } });
    if (!donor) throw new NotFoundException('Donor not found');

    return this.prisma.donorCommunicationLog.create({
      data: body,
      include: { donor: { select: { id: true, name: true } } },
    });
  }

  async updateCommunication(id: string, body: UpdateCommunicationDto) {
    const existing = await this.prisma.donorCommunicationLog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Communication log not found');

    return this.prisma.donorCommunicationLog.update({
      where: { id },
      data: body,
      include: { donor: { select: { id: true, name: true } } },
    });
  }

  async removeCommunication(id: string) {
    const existing = await this.prisma.donorCommunicationLog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Communication log not found');
    await this.prisma.donorCommunicationLog.delete({ where: { id } });
    return { ok: true };
  }

  async exportCsv(type: string) {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    if (type === 'donors') {
      const rows = await this.prisma.donor.findMany({
        include: { donations: { select: { amount: true } } },
        take: 5000,
      });
      const header = 'Name,Mobile,Email,Address,DonationCount,TotalAmount,CreatedAt';
      const lines = rows.map((r) =>
        [
          r.name,
          r.mobile ?? '',
          r.email ?? '',
          r.address ?? '',
          r.donations.length,
          r.donations.reduce((s, d) => s + d.amount, 0),
          r.createdAt.toISOString(),
        ].map(esc).join(','),
      );
      return [header, ...lines].join('\n');
    }

    if (type === 'donations') {
      const rows = await this.prisma.donation.findMany({
        include: {
          donor: { select: { name: true } },
          event: { select: { name: true } },
          receipt: { select: { receiptNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      const header = 'Donor,Amount,PaymentMode,Event,ReceiptNo,Notes,CreatedAt';
      const lines = rows.map((r) =>
        [
          r.donor.name,
          r.amount,
          r.paymentMode,
          r.event?.name ?? '',
          r.receipt?.receiptNo ?? '',
          r.notes ?? '',
          r.createdAt.toISOString(),
        ].map(esc).join(','),
      );
      return [header, ...lines].join('\n');
    }

    if (type === 'events') {
      const rows = await this.prisma.fundraisingEvent.findMany({
        include: { donations: { select: { amount: true } } },
      });
      const header = 'Name,EventDate,TargetAmount,RaisedAmount,DonationCount';
      const lines = rows.map((r) =>
        [
          r.name,
          r.eventDate?.toISOString() ?? '',
          r.targetAmount,
          r.donations.reduce((s, d) => s + d.amount, 0),
          r.donations.length,
        ].map(esc).join(','),
      );
      return [header, ...lines].join('\n');
    }

    if (type === 'follow-ups') {
      const rows = await this.prisma.donorFollowUp.findMany({
        include: { donor: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5000,
      });
      const header = 'Donor,DueDate,Completed,Notes,CreatedAt';
      const lines = rows.map((r) =>
        [
          r.donor.name,
          r.dueDate.toISOString(),
          r.completed,
          r.notes ?? '',
          r.createdAt.toISOString(),
        ].map(esc).join(','),
      );
      return [header, ...lines].join('\n');
    }

    throw new BadRequestException(`Unknown export type: ${type}`);
  }
}
