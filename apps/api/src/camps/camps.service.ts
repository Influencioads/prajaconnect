import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import {
  CampQueryDto,
  CreateCampDto,
  PreregisterMatchesDto,
  UpdateCampDto,
  UpdateRegistrationDto,
  WalkInDto,
} from './dto/camp.dto';

const listInclude = {
  village: { select: { id: true, name: true } },
  mandal: { select: { id: true, name: true } },
  _count: { select: { registrations: true } },
} satisfies Prisma.ServiceCampInclude;

const registrationInclude = {
  citizen: {
    select: {
      id: true,
      name: true,
      mobile: true,
      village: { select: { id: true, name: true } },
      booth: { select: { id: true, number: true } },
    },
  },
} satisfies Prisma.CampRegistrationInclude;

/** Outcomes that map straight onto a SchemeMatch status after the camp. */
const MATCH_OUTCOMES = ['Applied', 'Enrolled', 'NotEligible'];

@Injectable()
export class CampsService {
  constructor(private prisma: PrismaService) {}

  async list(query: CampQueryDto) {
    const { page, limit, search, status, mandalId, villageId, upcoming } = query;
    const where: Prisma.ServiceCampWhereInput = {};
    if (status) where.status = status;
    if (mandalId) where.mandalId = mandalId;
    if (villageId) where.villageId = villageId;
    if (upcoming) {
      where.date = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
      where.status = { in: ['Planned', 'Ongoing'] };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.serviceCamp.findMany({
        where,
        include: listInclude,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceCamp.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const [total, upcoming, completed, registrations, resolved] = await Promise.all([
      this.prisma.serviceCamp.count(),
      this.prisma.serviceCamp.count({
        where: { date: { gte: today }, status: { in: ['Planned', 'Ongoing'] } },
      }),
      this.prisma.serviceCamp.count({ where: { status: 'Completed' } }),
      this.prisma.campRegistration.count(),
      this.prisma.campRegistration.count({ where: { resolvedOnSpot: true } }),
    ]);
    return { total, upcoming, completed, registrations, resolved };
  }

  async get(id: string) {
    const camp = await this.prisma.serviceCamp.findUnique({
      where: { id },
      include: {
        ...listInclude,
        registrations: { include: registrationInclude, orderBy: { token: 'asc' } },
      },
    });
    if (!camp) throw new NotFoundException('Camp not found');

    const schemeIds = (camp.targetSchemes ?? []) as string[];
    const schemes = schemeIds.length
      ? await this.prisma.scheme.findMany({
          where: { id: { in: schemeIds } },
          select: { id: true, name: true, code: true },
        })
      : [];
    return { ...camp, schemes };
  }

  async create(dto: CreateCampDto, userId?: string) {
    const { date, targetSchemes, ...rest } = dto;
    return this.prisma.serviceCamp.create({
      data: {
        ...rest,
        date: new Date(date),
        targetSchemes: (targetSchemes ?? []) as Prisma.InputJsonValue,
        createdBy: userId ?? null,
      },
      include: listInclude,
    });
  }

  async update(id: string, dto: UpdateCampDto) {
    await this.ensureCamp(id);
    const { date, targetSchemes, ...rest } = dto;
    return this.prisma.serviceCamp.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
        ...(targetSchemes !== undefined
          ? { targetSchemes: targetSchemes as Prisma.InputJsonValue }
          : {}),
      },
      include: listInclude,
    });
  }

  async remove(id: string) {
    await this.ensureCamp(id);
    await this.prisma.serviceCamp.delete({ where: { id } });
    return { success: true };
  }

  /** Bulk-create pre-registrations from SchemeMatch rows in the camp's village/mandal. */
  async preregisterMatches(campId: string, dto: PreregisterMatchesDto) {
    const camp = await this.ensureCamp(campId);
    if (!dto.schemeIds.length) throw new BadRequestException('schemeIds required');

    const matches = await this.prisma.schemeMatch.findMany({
      where: {
        schemeId: { in: dto.schemeIds },
        status: { in: ['Suggested', 'Contacted'] },
        citizen: camp.villageId
          ? { villageId: camp.villageId }
          : camp.mandalId
            ? { mandalId: camp.mandalId }
            : {},
      },
      include: { scheme: { select: { name: true } } },
      orderBy: { score: 'desc' },
    });

    // One registration per citizen; purpose lists all matched schemes.
    const byCitizen = new Map<string, string[]>();
    for (const m of matches) {
      const names = byCitizen.get(m.citizenId) ?? [];
      names.push(m.scheme.name);
      byCitizen.set(m.citizenId, names);
    }
    if (byCitizen.size === 0) return { created: 0 };

    const existing = await this.prisma.campRegistration.findMany({
      where: { campId },
      select: { citizenId: true },
    });
    const registered = new Set(existing.map((r) => r.citizenId));
    let token = await this.nextToken(campId);

    const rows: Prisma.CampRegistrationCreateManyInput[] = [];
    for (const [citizenId, schemeNames] of byCitizen) {
      if (registered.has(citizenId)) continue;
      rows.push({
        campId,
        citizenId,
        source: 'PreRegistered',
        token: token++,
        purpose: schemeNames.join(', '),
      });
    }
    const result = rows.length
      ? await this.prisma.campRegistration.createMany({ data: rows, skipDuplicates: true })
      : { count: 0 };
    return { created: result.count, matched: matches.length };
  }

  /** Camp-day walk-in registration with auto token. */
  async walkIn(campId: string, dto: WalkInDto) {
    await this.ensureCamp(campId);
    const citizen = await this.prisma.citizen.findUnique({
      where: { id: dto.citizenId },
      select: { id: true },
    });
    if (!citizen) throw new NotFoundException('Citizen not found');

    const already = await this.prisma.campRegistration.findUnique({
      where: { campId_citizenId: { campId, citizenId: dto.citizenId } },
      include: registrationInclude,
    });
    if (already) return already;

    return this.prisma.campRegistration.create({
      data: {
        campId,
        citizenId: dto.citizenId,
        source: 'WalkIn',
        token: await this.nextToken(campId),
        purpose: dto.purpose ?? null,
      },
      include: registrationInclude,
    });
  }

  async updateRegistration(id: string, dto: UpdateRegistrationDto) {
    const found = await this.prisma.campRegistration.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Registration not found');
    return this.prisma.campRegistration.update({
      where: { id },
      data: dto,
      include: registrationInclude,
    });
  }

  async summary(campId: string) {
    await this.ensureCamp(campId);
    const [registered, preRegistered, walkIn, attended, resolved, outcomes] = await Promise.all([
      this.prisma.campRegistration.count({ where: { campId } }),
      this.prisma.campRegistration.count({ where: { campId, source: 'PreRegistered' } }),
      this.prisma.campRegistration.count({ where: { campId, source: 'WalkIn' } }),
      this.prisma.campRegistration.count({
        where: { campId, OR: [{ source: 'WalkIn' }, { outcome: { not: null } }] },
      }),
      this.prisma.campRegistration.count({ where: { campId, resolvedOnSpot: true } }),
      this.prisma.campRegistration.groupBy({
        by: ['outcome'],
        where: { campId, outcome: { not: null } },
        _count: { _all: true },
      }),
    ]);
    return {
      registered,
      preRegistered,
      walkIn,
      attended,
      resolved,
      outcomes: outcomes.map((o) => ({ outcome: o.outcome, count: o._count._all })),
    };
  }

  /**
   * After-camp: push registration outcomes (Applied/Enrolled/NotEligible) back
   * onto the SchemeMatch rows for the camp's target schemes, and complete the camp.
   */
  async finalize(campId: string) {
    const camp = await this.ensureCamp(campId);
    const schemeIds = (camp.targetSchemes ?? []) as string[];

    let matchesUpdated = 0;
    if (schemeIds.length) {
      const regs = await this.prisma.campRegistration.findMany({
        where: { campId, outcome: { in: MATCH_OUTCOMES } },
        select: { citizenId: true, outcome: true },
      });
      for (const reg of regs) {
        const result = await this.prisma.schemeMatch.updateMany({
          where: { citizenId: reg.citizenId, schemeId: { in: schemeIds } },
          data: { status: reg.outcome! },
        });
        matchesUpdated += result.count;
      }
    }

    await this.prisma.serviceCamp.update({ where: { id: campId }, data: { status: 'Completed' } });
    return { success: true, matchesUpdated };
  }

  private async nextToken(campId: string): Promise<number> {
    const max = await this.prisma.campRegistration.aggregate({
      where: { campId },
      _max: { token: true },
    });
    return (max._max.token ?? 0) + 1;
  }

  private async ensureCamp(id: string) {
    const camp = await this.prisma.serviceCamp.findUnique({
      where: { id },
      select: { id: true, villageId: true, mandalId: true, targetSchemes: true },
    });
    if (!camp) throw new NotFoundException('Camp not found');
    return camp;
  }
}
