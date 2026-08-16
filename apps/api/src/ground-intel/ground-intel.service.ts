import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ActivityType,
  EventStatus,
  EventType,
  GrievanceStatus,
  OfficialLevel,
  Prisma,
} from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

/** A link only helps us if the person is on our side. */
const FRIENDLY = 'Supports';

export const INFLUENCE_PERSON_TYPES = [
  'Influencer',
  'ImpLeader',
  'CommitteeMember',
  'Observer',
  'PressContact',
] as const;
export const INFLUENCE_RELATIONS = ['Supports', 'Neutral', 'Rival'] as const;
export const OPPOSITION_ACTIVITY_TYPES = [
  'Meeting',
  'BoothVisit',
  'Promise',
  'Defection',
  'Rally',
  'Other',
] as const;

/** Activity rows that count as "someone actually went there". */
const VISIT_ACTIVITY_TYPES: ActivityType[] = [
  ActivityType.Visit,
  ActivityType.FieldVisit,
  ActivityType.DoorToDoor,
];

/** Mandal level and above is "senior cadre" for visit-coverage purposes. */
const SENIOR_CADRE_LEVELS: OfficialLevel[] = [
  OfficialLevel.Mandal,
  OfficialLevel.Constituency,
  OfficialLevel.District,
  OfficialLevel.State,
];

const OPEN_GRIEVANCE_STATUSES: GrievanceStatus[] = [
  GrievanceStatus.Open,
  GrievanceStatus.Assigned,
  GrievanceStatus.InProgress,
  GrievanceStatus.Escalated,
];

const DAY_MS = 24 * 60 * 60 * 1000;

export type VisitBucket = 'green' | 'amber' | 'red';

function bucketFor(daysSince: number | null): VisitBucket {
  if (daysSince === null) return 'red';
  if (daysSince < 30) return 'green';
  if (daysSince < 90) return 'amber';
  return 'red';
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

function maxDate(...dates: (Date | null | undefined)[]): Date | null {
  let best: Date | null = null;
  for (const d of dates) {
    if (d && (!best || d > best)) best = d;
  }
  return best;
}

export interface GeoFilter {
  mandalId?: string;
  villageId?: string;
  boothId?: string;
}

@Injectable()
export class GroundIntelService {
  private readonly logger = new Logger(GroundIntelService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================================
  // 1. Influence graph
  // ============================================================
  async listLinks(query: PaginationDto & GeoFilter & { personType?: string; relation?: string; community?: string }) {
    const { page, limit, search } = query;
    const where: Prisma.InfluenceLinkWhereInput = {};
    if (query.boothId) where.boothId = query.boothId;
    if (query.villageId) where.villageId = query.villageId;
    if (query.mandalId) where.village = { mandalId: query.mandalId };
    if (query.personType) where.personType = query.personType;
    if (query.relation) where.relation = query.relation;
    if (query.community) where.community = query.community;
    if (search) {
      where.OR = [
        { community: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { personId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.influenceLink.findMany({
        where,
        orderBy: [{ strength: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          booth: { select: { id: true, number: true, name: true } },
          village: { select: { id: true, name: true, mandal: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.influenceLink.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createLink(body: {
    personType: string;
    personId: string;
    boothId?: string;
    villageId?: string;
    community?: string;
    strength?: number;
    relation?: string;
    notes?: string;
  }) {
    return this.prisma.influenceLink.create({
      data: {
        personType: body.personType,
        personId: body.personId,
        boothId: body.boothId || null,
        villageId: body.villageId || null,
        community: body.community || null,
        strength: clampStrength(body.strength),
        relation: body.relation || FRIENDLY,
        notes: body.notes || null,
      },
      include: {
        booth: { select: { id: true, number: true, name: true } },
        village: { select: { id: true, name: true } },
      },
    });
  }

  async updateLink(id: string, body: Record<string, unknown>) {
    await this.ensureLink(id);
    const data: Prisma.InfluenceLinkUpdateInput = {};
    if (body.personType !== undefined) data.personType = body.personType as string;
    if (body.personId !== undefined) data.personId = body.personId as string;
    if (body.community !== undefined) data.community = (body.community as string) || null;
    if (body.relation !== undefined) data.relation = (body.relation as string) || FRIENDLY;
    if (body.notes !== undefined) data.notes = (body.notes as string) || null;
    if (body.strength !== undefined) data.strength = clampStrength(body.strength as number);
    if (body.boothId !== undefined) {
      data.booth = body.boothId ? { connect: { id: body.boothId as string } } : { disconnect: true };
    }
    if (body.villageId !== undefined) {
      data.village = body.villageId ? { connect: { id: body.villageId as string } } : { disconnect: true };
    }
    return this.prisma.influenceLink.update({
      where: { id },
      data,
      include: {
        booth: { select: { id: true, number: true, name: true } },
        village: { select: { id: true, name: true } },
      },
    });
  }

  async removeLink(id: string) {
    await this.ensureLink(id);
    await this.prisma.influenceLink.delete({ where: { id } });
    return { success: true };
  }

  private async ensureLink(id: string) {
    const found = await this.prisma.influenceLink.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Influence link not found');
  }

  /**
   * Per-booth influence coverage. Booths with zero friendly links that are also
   * Weak/Swing on BoothVoterStrength come back as the `urgent` list.
   *
   * ponytail: booths + their links are joined in memory (one findMany each).
   * Fine up to a constituency; move to a SQL group-by if this ever spans a state.
   */
  async coverage(filter: GeoFilter) {
    const boothWhere: Prisma.BoothWhereInput = {};
    if (filter.boothId) boothWhere.id = filter.boothId;
    if (filter.villageId) boothWhere.villageId = filter.villageId;
    if (filter.mandalId) boothWhere.village = { mandalId: filter.mandalId };

    const booths = await this.prisma.booth.findMany({
      where: boothWhere,
      select: {
        id: true,
        number: true,
        name: true,
        voterCount: true,
        village: { select: { id: true, name: true, mandal: { select: { id: true, name: true } } } },
        boothVoterStrength: {
          select: { strengthLabel: true, supporterPct: true, priorityBoothScore: true },
        },
      },
      orderBy: { number: 'asc' },
    });

    const [links, communityRows] = await Promise.all([
      this.prisma.influenceLink.findMany({
        where: { boothId: { in: booths.map((b) => b.id) } },
        select: { boothId: true, community: true, relation: true, strength: true, personType: true },
      }),
      this.prisma.influenceLink.findMany({
        where: { community: { not: null } },
        distinct: ['community'],
        select: { community: true },
      }),
    ]);

    // Every community we have ever recorded a link for — the yardstick a booth
    // is measured against.
    const communityUniverse = communityRows
      .map((r) => r.community as string)
      .filter(Boolean)
      .sort();

    const byBooth = new Map<string, typeof links>();
    for (const link of links) {
      if (!link.boothId) continue;
      const bucket = byBooth.get(link.boothId) ?? [];
      bucket.push(link);
      byBooth.set(link.boothId, bucket);
    }

    const rows = booths.map((booth) => {
      const boothLinks = byBooth.get(booth.id) ?? [];
      const friendly = boothLinks.filter((l) => l.relation === FRIENDLY);
      const covered = [
        ...new Set(friendly.map((l) => l.community).filter((c): c is string => !!c)),
      ].sort();
      const coveredSet = new Set(covered);
      const strengthLabel = booth.boothVoterStrength?.strengthLabel ?? null;
      const zeroFriendly = friendly.length === 0;
      return {
        boothId: booth.id,
        boothNumber: booth.number,
        boothName: booth.name,
        voterCount: booth.voterCount,
        villageId: booth.village?.id ?? null,
        villageName: booth.village?.name ?? null,
        mandalId: booth.village?.mandal?.id ?? null,
        mandalName: booth.village?.mandal?.name ?? null,
        totalLinks: boothLinks.length,
        friendlyLinks: friendly.length,
        neutralLinks: boothLinks.filter((l) => l.relation === 'Neutral').length,
        rivalLinks: boothLinks.filter((l) => l.relation === 'Rival').length,
        avgFriendlyStrength: friendly.length
          ? Math.round((friendly.reduce((s, l) => s + l.strength, 0) / friendly.length) * 10) / 10
          : 0,
        communitiesCovered: covered,
        communitiesUncovered: communityUniverse.filter((c) => !coveredSet.has(c)),
        strengthLabel,
        supporterPct: booth.boothVoterStrength?.supporterPct ?? null,
        priorityBoothScore: booth.boothVoterStrength?.priorityBoothScore ?? 0,
        zeroFriendly,
        urgent: zeroFriendly && (strengthLabel === 'Weak' || strengthLabel === 'Swing'),
      };
    });

    const urgent = rows
      .filter((r) => r.urgent)
      .sort((a, b) => b.priorityBoothScore - a.priorityBoothScore || b.voterCount - a.voterCount);

    return {
      communityUniverse,
      totals: {
        booths: rows.length,
        boothsWithFriendlyLink: rows.filter((r) => !r.zeroFriendly).length,
        zeroFriendlyBooths: rows.filter((r) => r.zeroFriendly).length,
        urgentBooths: urgent.length,
        totalLinks: links.length,
      },
      booths: rows,
      urgent,
    };
  }

  // ============================================================
  // 2. Opposition ground tracker
  // ============================================================
  async listOpposition(
    query: PaginationDto & GeoFilter & { activityType?: string; rivalName?: string; party?: string; sinceDays?: number },
  ) {
    const { page, limit, search } = query;
    const where: Prisma.OppositionActivityWhereInput = {};
    if (query.mandalId) where.mandalId = query.mandalId;
    if (query.villageId) where.villageId = query.villageId;
    if (query.boothId) where.boothId = query.boothId;
    if (query.activityType) where.activityType = query.activityType;
    if (query.party) where.party = query.party;
    if (query.rivalName) where.rivalName = { contains: query.rivalName, mode: 'insensitive' };
    if (query.sinceDays) {
      where.occurredAt = { gte: new Date(Date.now() - Number(query.sinceDays) * DAY_MS) };
    }
    if (search) {
      where.OR = [
        { rivalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { party: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.oppositionActivity.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          village: { select: { id: true, name: true } },
          mandal: { select: { id: true, name: true } },
          booth: { select: { id: true, number: true, name: true } },
          reportedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.oppositionActivity.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createOpposition(
    body: {
      rivalName: string;
      party?: string;
      activityType?: string;
      villageId?: string;
      mandalId?: string;
      boothId?: string;
      description: string;
      headcount?: number;
      photoUrl?: string;
      occurredAt?: string;
    },
    userId: string,
  ) {
    const headcount = Number(body.headcount);
    return this.prisma.oppositionActivity.create({
      data: {
        rivalName: body.rivalName,
        party: body.party || null,
        activityType: body.activityType || 'Other',
        villageId: body.villageId || null,
        mandalId: body.mandalId || null,
        boothId: body.boothId || null,
        description: body.description,
        headcount: Number.isFinite(headcount) && headcount > 0 ? Math.round(headcount) : null,
        photoUrl: body.photoUrl || null,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        reportedById: userId,
      },
      include: {
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        booth: { select: { id: true, number: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateOpposition(id: string, body: Record<string, unknown>) {
    await this.ensureOpposition(id);
    const data: Prisma.OppositionActivityUpdateInput = {};
    if (body.rivalName !== undefined) data.rivalName = body.rivalName as string;
    if (body.party !== undefined) data.party = (body.party as string) || null;
    if (body.activityType !== undefined) data.activityType = (body.activityType as string) || 'Other';
    if (body.description !== undefined) data.description = body.description as string;
    if (body.photoUrl !== undefined) data.photoUrl = (body.photoUrl as string) || null;
    if (body.occurredAt !== undefined) data.occurredAt = new Date(body.occurredAt as string);
    if (body.headcount !== undefined) {
      const n = Number(body.headcount);
      data.headcount = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    }
    if (body.villageId !== undefined) {
      data.village = body.villageId ? { connect: { id: body.villageId as string } } : { disconnect: true };
    }
    if (body.mandalId !== undefined) {
      data.mandal = body.mandalId ? { connect: { id: body.mandalId as string } } : { disconnect: true };
    }
    if (body.boothId !== undefined) {
      data.booth = body.boothId ? { connect: { id: body.boothId as string } } : { disconnect: true };
    }
    return this.prisma.oppositionActivity.update({
      where: { id },
      data,
      include: {
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    });
  }

  async removeOpposition(id: string) {
    await this.ensureOpposition(id);
    await this.prisma.oppositionActivity.delete({ where: { id } });
    return { success: true };
  }

  private async ensureOpposition(id: string) {
    const found = await this.prisma.oppositionActivity.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Opposition activity not found');
  }

  /** Per-mandal counts for the last 30 days by type, with a trend vs the 30 days before that. */
  async oppositionHeat(filter: GeoFilter) {
    const now = new Date();
    const from30 = new Date(now.getTime() - 30 * DAY_MS);
    const from60 = new Date(now.getTime() - 60 * DAY_MS);

    const rows = await this.prisma.oppositionActivity.findMany({
      where: {
        occurredAt: { gte: from60 },
        ...(filter.mandalId ? { mandalId: filter.mandalId } : {}),
      },
      select: {
        mandalId: true,
        mandal: { select: { id: true, name: true } },
        activityType: true,
        occurredAt: true,
        headcount: true,
      },
    });

    const map = new Map<
      string,
      {
        mandalId: string | null;
        mandalName: string;
        last30: number;
        prev30: number;
        headcount30: number;
        byType: Record<string, number>;
      }
    >();

    for (const row of rows) {
      const key = row.mandalId ?? '__unassigned__';
      const entry =
        map.get(key) ??
        {
          mandalId: row.mandalId,
          mandalName: row.mandal?.name ?? 'Unassigned',
          last30: 0,
          prev30: 0,
          headcount30: 0,
          byType: {} as Record<string, number>,
        };
      if (row.occurredAt >= from30) {
        entry.last30 += 1;
        entry.headcount30 += row.headcount ?? 0;
        entry.byType[row.activityType] = (entry.byType[row.activityType] ?? 0) + 1;
      } else {
        entry.prev30 += 1;
      }
      map.set(key, entry);
    }

    const mandals = [...map.values()]
      .map((m) => ({
        ...m,
        trend: m.last30 - m.prev30,
        trendPct: m.prev30 ? Math.round(((m.last30 - m.prev30) / m.prev30) * 100) : m.last30 ? 100 : 0,
      }))
      .sort((a, b) => b.last30 - a.last30);

    const totalsByType: Record<string, number> = {};
    for (const m of mandals) {
      for (const [type, count] of Object.entries(m.byType)) {
        totalsByType[type] = (totalsByType[type] ?? 0) + count;
      }
    }

    return {
      windowDays: 30,
      totals: {
        last30: mandals.reduce((s, m) => s + m.last30, 0),
        prev30: mandals.reduce((s, m) => s + m.prev30, 0),
        headcount30: mandals.reduce((s, m) => s + m.headcount30, 0),
        byType: totalsByType,
      },
      mandals,
    };
  }

  // ============================================================
  // 3. Visit coverage planner
  // ============================================================
  /**
   * Days since a leader / senior cadre last set foot in each village.
   * Two sources: visit-type Activity rows, and VolunteerAttendance check-ins by
   * Mandal-level-and-above cadre (mapped to a village through their booth).
   */
  async visitCoverage(filter: GeoFilter) {
    const now = new Date();
    const villages = await this.prisma.village.findMany({
      where: filter.mandalId ? { mandalId: filter.mandalId } : {},
      select: { id: true, name: true, mandal: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    const villageIds = villages.map((v) => v.id);

    const [activityGroups, attendances] = await Promise.all([
      this.prisma.activity.groupBy({
        by: ['villageId'],
        where: { villageId: { in: villageIds }, type: { in: VISIT_ACTIVITY_TYPES } },
        _max: { completedAt: true, startedAt: true, scheduledAt: true, createdAt: true },
      }),
      // ponytail: one year of senior check-ins reduced in memory — the village
      // lives behind cadre->booth so Prisma cannot group it server-side.
      this.prisma.volunteerAttendance.findMany({
        where: {
          checkInAt: { gte: new Date(now.getTime() - 365 * DAY_MS) },
          cadre: {
            level: { in: SENIOR_CADRE_LEVELS },
            booth: { villageId: { in: villageIds } },
          },
        },
        select: { checkInAt: true, cadre: { select: { booth: { select: { villageId: true } } } } },
        orderBy: { checkInAt: 'desc' },
      }),
    ]);

    const activityLast = new Map<string, Date>();
    for (const g of activityGroups) {
      if (!g.villageId) continue;
      const best = maxDate(g._max.completedAt, g._max.startedAt, g._max.scheduledAt, g._max.createdAt);
      if (best) activityLast.set(g.villageId, best);
    }

    const attendanceLast = new Map<string, Date>();
    for (const a of attendances) {
      const vid = a.cadre?.booth?.villageId;
      if (!vid || attendanceLast.has(vid)) continue; // rows are newest-first
      attendanceLast.set(vid, a.checkInAt);
    }

    const rows = villages.map((v) => {
      const fromActivity = activityLast.get(v.id) ?? null;
      const fromAttendance = attendanceLast.get(v.id) ?? null;
      const lastVisitAt = maxDate(fromActivity, fromAttendance);
      const daysSince = lastVisitAt ? Math.max(0, daysBetween(lastVisitAt, now)) : null;
      return {
        villageId: v.id,
        villageName: v.name,
        mandalId: v.mandal?.id ?? null,
        mandalName: v.mandal?.name ?? null,
        lastVisitAt,
        lastVisitSource:
          lastVisitAt === null
            ? null
            : lastVisitAt === fromAttendance
              ? 'SeniorCadreAttendance'
              : 'VisitActivity',
        daysSince,
        bucket: bucketFor(daysSince),
      };
    });

    return {
      summary: {
        villages: rows.length,
        green: rows.filter((r) => r.bucket === 'green').length,
        amber: rows.filter((r) => r.bucket === 'amber').length,
        red: rows.filter((r) => r.bucket === 'red').length,
        neverVisited: rows.filter((r) => r.daysSince === null).length,
      },
      villages: rows,
    };
  }

  /** Staleness-sorted village worklist with what is waiting in each one. */
  async visitPlan(filter: GeoFilter) {
    const coverage = await this.visitCoverage(filter);
    const villageIds = coverage.villages.map((v) => v.villageId);
    if (!villageIds.length) return { summary: coverage.summary, villages: [] };

    const [grievances, camps, boothRows, links, schemeBacklog] = await Promise.all([
      this.prisma.grievance.groupBy({
        by: ['villageId'],
        where: { villageId: { in: villageIds }, status: { in: OPEN_GRIEVANCE_STATUSES } },
        _count: { _all: true },
      }),
      this.prisma.event.groupBy({
        by: ['villageId'],
        where: {
          villageId: { in: villageIds },
          type: EventType.Camp,
          status: { in: [EventStatus.Scheduled, EventStatus.Ongoing] },
        },
        _count: { _all: true },
      }),
      this.prisma.booth.findMany({
        where: { villageId: { in: villageIds } },
        select: { id: true, villageId: true },
      }),
      this.prisma.influenceLink.findMany({
        where: { relation: FRIENDLY, booth: { villageId: { in: villageIds } } },
        select: { boothId: true },
      }),
      this.pendingSchemeMatchCounts(villageIds),
    ]);

    const grievanceCount = countByVillage(grievances);
    const campCount = countByVillage(camps);
    const coveredBooths = new Set(links.map((l) => l.boothId).filter((b): b is string => !!b));

    const boothStats = new Map<string, { total: number; uncovered: number }>();
    for (const booth of boothRows) {
      const entry = boothStats.get(booth.villageId) ?? { total: 0, uncovered: 0 };
      entry.total += 1;
      if (!coveredBooths.has(booth.id)) entry.uncovered += 1;
      boothStats.set(booth.villageId, entry);
    }

    const villages = coverage.villages
      .map((v) => {
        const booths = boothStats.get(v.villageId) ?? { total: 0, uncovered: 0 };
        const pending = {
          openGrievances: grievanceCount[v.villageId] ?? 0,
          activeCamps: campCount[v.villageId] ?? 0,
          pendingSchemeMatches: schemeBacklog[v.villageId] ?? 0,
          totalBooths: booths.total,
          uncoveredBooths: booths.uncovered,
        };
        return {
          ...v,
          pending,
          pendingTotal:
            pending.openGrievances +
            pending.activeCamps +
            pending.pendingSchemeMatches +
            pending.uncoveredBooths,
        };
      })
      // Never-visited first, then oldest visit first, then most pending work.
      .sort(
        (a, b) =>
          (b.daysSince ?? Number.MAX_SAFE_INTEGER) - (a.daysSince ?? Number.MAX_SAFE_INTEGER) ||
          b.pendingTotal - a.pendingTotal,
      );

    return { summary: coverage.summary, villages };
  }

  /**
   * SchemeMatch is not in every deployment's schema — probe the client property
   * and degrade to "no scheme backlog" with a log line when it is missing.
   */
  private async pendingSchemeMatchCounts(villageIds: string[]): Promise<Record<string, number>> {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const delegate = (this.prisma as unknown as Record<string, any>)['schemeMatch'];
    if (!delegate?.groupBy) {
      this.logger.log('SchemeMatch model not present in the Prisma client — scheme backlog omitted from visit plan');
      return {};
    }
    try {
      const rows = await delegate.groupBy({
        by: ['villageId'],
        where: { villageId: { in: villageIds }, status: 'Pending' },
        _count: { _all: true },
      });
      return countByVillage(rows);
    } catch (e) {
      this.logger.warn(`SchemeMatch backlog unavailable: ${(e as Error).message}`);
      return {};
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}

function clampStrength(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function countByVillage(
  rows: { villageId: string | null; _count: { _all: number } }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    if (row.villageId) out[row.villageId] = row._count._all;
  }
  return out;
}
