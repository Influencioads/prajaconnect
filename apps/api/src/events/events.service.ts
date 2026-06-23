import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { CheckInDto, CreateEventDto, EventQueryDto, UpdateEventDto } from './dto/event.dto';

const listInclude = {
  mandal: { select: { id: true, name: true } },
  organizer: { select: { id: true, name: true } },
  _count: { select: { attendees: true } },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async list(query: EventQueryDto) {
    const { page, limit, search, status, type, mandalId } = query;
    const where: Prisma.EventWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (mandalId) where.mandalId = mandalId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: listInclude,
        orderBy: { startAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const [total, upcoming, completed, attendees] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: { in: ['Scheduled', 'Ongoing'] } } }),
      this.prisma.event.count({ where: { status: 'Completed' } }),
      this.prisma.eventAttendee.count({ where: { checkedInAt: { not: null } } }),
    ]);
    return { total, upcoming, completed, checkedIn: attendees };
  }

  async get(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        mandal: { select: { id: true, name: true } },
        village: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true, designation: true } },
        attendees: {
          include: { citizen: { select: { id: true, name: true } } },
          orderBy: { checkedInAt: 'desc' },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(dto: CreateEventDto) {
    const { startAt, endAt, ...rest } = dto;
    return this.prisma.event.create({
      data: {
        ...rest,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        qrToken: randomBytes(8).toString('hex'),
      },
      include: listInclude,
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.ensureExists(id);
    const { startAt, endAt, ...rest } = dto;
    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt !== undefined ? { endAt: endAt ? new Date(endAt) : null } : {}),
      },
      include: listInclude,
    });
  }

  async checkIn(id: string, dto: CheckInDto) {
    await this.ensureExists(id);
    // QR check-in placeholder: in production the QR encodes the event token + citizen ref.
    let name = dto.name;
    let mobile = dto.mobile;
    if (dto.citizenId) {
      const citizen = await this.prisma.citizen.findUnique({
        where: { id: dto.citizenId },
        select: { name: true, mobile: true },
      });
      if (citizen) {
        name = name ?? citizen.name;
        mobile = mobile ?? citizen.mobile ?? undefined;
      }
    }
    return this.prisma.eventAttendee.create({
      data: {
        eventId: id,
        citizenId: dto.citizenId ?? null,
        name,
        mobile,
        checkedInAt: new Date(),
        method: 'manual',
      },
      include: { citizen: { select: { id: true, name: true } } },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Event not found');
  }
}
