import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BoothStrength,
  Prisma,
  VoterDuplicateStatus,
  VoterPreference,
} from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import {
  CreateProfileDto,
  CreateSegmentDto,
  DuplicateQueryDto,
  ImportRollDto,
  ProfileQueryDto,
  ReviewDuplicateDto,
  UpdateProfileDto,
  UpdateSegmentDto,
} from './dto/voter-intelligence.dto';

const profileInclude = {
  citizen: {
    select: {
      id: true,
      name: true,
      mobile: true,
      voterId: true,
      boothId: true,
      villageId: true,
      mandalId: true,
      familyId: true,
      booth: { select: { id: true, number: true, name: true } },
      village: { select: { id: true, name: true } },
      mandal: { select: { id: true, name: true } },
      family: { select: { id: true, headName: true } },
    },
  },
  segment: { select: { id: true, name: true, color: true } },
} satisfies Prisma.VoterIntelligenceProfileInclude;

function computePriorityScore(p: {
  isKeyVoter: boolean;
  isInfluencer: boolean;
  isSwing: boolean;
  preference: VoterPreference;
}): number {
  let score = 0;
  if (p.isKeyVoter) score += 30;
  if (p.isInfluencer) score += 25;
  if (p.isSwing) score += 20;
  if (p.preference === VoterPreference.Supporter) score += 15;
  if (p.preference === VoterPreference.Opponent) score += 10;
  return Math.min(100, score);
}

function mapD2dSentiment(s: string | null | undefined): VoterPreference {
  if (s === 'Supporter') return VoterPreference.Supporter;
  if (s === 'Neutral') return VoterPreference.Neutral;
  if (s === 'Opponent') return VoterPreference.Opponent;
  if (s === 'Undecided') return VoterPreference.Swing;
  return VoterPreference.Unknown;
}

function mapVoterStance(s: string): VoterPreference {
  if (s === 'Supporter') return VoterPreference.Supporter;
  if (s === 'Neutral') return VoterPreference.Neutral;
  if (s === 'Opponent') return VoterPreference.Opponent;
  return VoterPreference.Unknown;
}

@Injectable()
export class VoterIntelligenceService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [
      totalProfiles,
      supporters,
      neutrals,
      opponents,
      swings,
      keyVoters,
      influencers,
      pendingDuplicates,
      segmentCounts,
      boothStrengths,
    ] = await Promise.all([
      this.prisma.voterIntelligenceProfile.count(),
      this.prisma.voterIntelligenceProfile.count({ where: { preference: VoterPreference.Supporter } }),
      this.prisma.voterIntelligenceProfile.count({ where: { preference: VoterPreference.Neutral } }),
      this.prisma.voterIntelligenceProfile.count({ where: { preference: VoterPreference.Opponent } }),
      this.prisma.voterIntelligenceProfile.count({ where: { isSwing: true } }),
      this.prisma.voterIntelligenceProfile.count({ where: { isKeyVoter: true } }),
      this.prisma.voterIntelligenceProfile.count({ where: { isInfluencer: true } }),
      this.prisma.voterDuplicateCandidate.count({ where: { status: VoterDuplicateStatus.Pending } }),
      this.prisma.voterIntelligenceProfile.groupBy({
        by: ['segmentId'],
        _count: { _all: true },
      }),
      this.prisma.boothVoterStrength.findMany({
        take: 10,
        orderBy: { priorityBoothScore: 'desc' },
        include: { booth: { select: { id: true, number: true, name: true } } },
      }),
    ]);

    const segments = await this.prisma.voterSegment.findMany({
      select: { id: true, name: true, color: true },
    });
    const segmentMap = new Map(segments.map((s) => [s.id, s]));
    const bySegment = segmentCounts.map((g) => ({
      segmentId: g.segmentId,
      segment: g.segmentId ? segmentMap.get(g.segmentId) : { name: 'Unassigned', color: '#999' },
      count: g._count._all,
    }));

    return {
      totalProfiles,
      supporters,
      neutrals,
      opponents,
      swings,
      keyVoters,
      influencers,
      pendingDuplicates,
      bySegment,
      topPriorityBooths: boothStrengths,
    };
  }

  async listProfiles(query: ProfileQueryDto) {
    const { page, limit, search, preference, segmentId, mandalId, villageId, boothId, isKeyVoter, isInfluencer, isSwing } = query;
    const where: Prisma.VoterIntelligenceProfileWhereInput = {};
    if (preference) where.preference = preference;
    if (segmentId) where.segmentId = segmentId;
    if (isKeyVoter !== undefined) where.isKeyVoter = isKeyVoter;
    if (isInfluencer !== undefined) where.isInfluencer = isInfluencer;
    if (isSwing !== undefined) where.isSwing = isSwing;
    if (mandalId || villageId || boothId || search) {
      where.citizen = {};
      if (mandalId) where.citizen.mandalId = mandalId;
      if (villageId) where.citizen.villageId = villageId;
      if (boothId) where.citizen.boothId = boothId;
      if (search) {
        where.citizen.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } },
          { voterId: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.voterIntelligenceProfile.findMany({
        where,
        include: profileInclude,
        orderBy: { priorityScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.voterIntelligenceProfile.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getProfile(id: string) {
    const profile = await this.prisma.voterIntelligenceProfile.findUnique({
      where: { id },
      include: {
        ...profileInclude,
        changeLogs: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const [d2dResponses, electionOutreach, rollEntry] = await Promise.all([
      this.prisma.d2DSurveyResponse.findMany({
        where: { household: { members: { some: { citizenId: profile.citizenId } } } },
        take: 5,
        orderBy: { submittedAt: 'desc' },
        select: { id: true, sentiment: true, isKeyVoter: true, influencer: true, submittedAt: true },
      }),
      this.prisma.electionVoterOutreach.findMany({
        where: { citizenId: profile.citizenId },
        take: 5,
        orderBy: { outreachDate: 'desc' },
        select: { id: true, stance: true, isKeyVoter: true, isInfluencer: true, outreachDate: true, channel: true },
      }),
      this.prisma.electoralRollEntry.findFirst({
        where: { matchedCitizenId: profile.citizenId },
      }),
    ]);

    return { ...profile, d2dResponses, electionOutreach, rollEntry };
  }

  async createProfile(dto: CreateProfileDto, user: AuthenticatedUser) {
    const existing = await this.prisma.voterIntelligenceProfile.findUnique({ where: { citizenId: dto.citizenId } });
    if (existing) return this.updateProfile(existing.id, dto as UpdateProfileDto, user);

    const preference = dto.preference ?? VoterPreference.Unknown;
    const isSwing = dto.isSwing ?? preference === VoterPreference.Swing;
    const priorityScore = computePriorityScore({
      isKeyVoter: dto.isKeyVoter ?? false,
      isInfluencer: dto.isInfluencer ?? false,
      isSwing,
      preference,
    });

    const profile = await this.prisma.voterIntelligenceProfile.create({
      data: {
        citizenId: dto.citizenId,
        preference,
        isKeyVoter: dto.isKeyVoter ?? false,
        isInfluencer: dto.isInfluencer ?? false,
        isSwing,
        segmentId: dto.segmentId,
        source: dto.source ?? 'Manual',
        notes: dto.notes,
        priorityScore,
        lastAssessedAt: new Date(),
      },
      include: profileInclude,
    });

    await this.logChange(profile.id, user.id, 'created', null, 'profile created');
    await this.recomputeFamilyPreference(profile.citizen.familyId);
    await this.recomputeBoothStrength(profile.citizen.boothId);
    return profile;
  }

  async updateProfile(id: string, dto: UpdateProfileDto, user: AuthenticatedUser) {
    const existing = await this.prisma.voterIntelligenceProfile.findUnique({
      where: { id },
      include: { citizen: { select: { familyId: true, boothId: true } } },
    });
    if (!existing) throw new NotFoundException('Profile not found');

    const preference = dto.preference ?? existing.preference;
    const isKeyVoter = dto.isKeyVoter ?? existing.isKeyVoter;
    const isInfluencer = dto.isInfluencer ?? existing.isInfluencer;
    const isSwing = dto.isSwing ?? existing.isSwing;
    const priorityScore = computePriorityScore({ isKeyVoter, isInfluencer, isSwing, preference });

    const profile = await this.prisma.voterIntelligenceProfile.update({
      where: { id },
      data: {
        preference: dto.preference,
        isKeyVoter: dto.isKeyVoter,
        isInfluencer: dto.isInfluencer,
        isSwing: dto.isSwing,
        segmentId: dto.segmentId,
        notes: dto.notes,
        priorityScore,
        lastAssessedAt: new Date(),
      },
      include: profileInclude,
    });

    if (dto.preference && dto.preference !== existing.preference) {
      await this.logChange(id, user.id, 'preference', existing.preference, dto.preference);
    }
    await this.recomputeFamilyPreference(existing.citizen.familyId);
    await this.recomputeBoothStrength(existing.citizen.boothId);
    return profile;
  }

  async listSegments() {
    return this.prisma.voterSegment.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { profiles: true } } },
    });
  }

  async createSegment(dto: CreateSegmentDto) {
    return this.prisma.voterSegment.create({ data: dto });
  }

  async updateSegment(id: string, dto: UpdateSegmentDto) {
    return this.prisma.voterSegment.update({ where: { id }, data: dto });
  }

  async deleteSegment(id: string) {
    await this.prisma.voterIntelligenceProfile.updateMany({ where: { segmentId: id }, data: { segmentId: null } });
    return this.prisma.voterSegment.delete({ where: { id } });
  }

  async listFamilies(query: ProfileQueryDto) {
    const { page, limit, mandalId, villageId, boothId } = query;
    const where: Prisma.FamilyVoterPreferenceWhereInput = {};
    const familyWhere: Prisma.FamilyWhereInput = {};
    if (boothId) familyWhere.boothId = boothId;
    if (villageId) familyWhere.villageId = villageId;
    if (mandalId) familyWhere.village = { mandalId };
    if (Object.keys(familyWhere).length) where.family = familyWhere;

    const [data, total] = await Promise.all([
      this.prisma.familyVoterPreference.findMany({
        where,
        include: {
          family: {
            select: {
              id: true,
              headName: true,
              booth: { select: { number: true, name: true } },
              village: { select: { name: true } },
            },
          },
        },
        orderBy: { memberCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.familyVoterPreference.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listBoothStrength(query: ProfileQueryDto) {
    const { page, limit, villageId } = query;
    const where: Prisma.BoothVoterStrengthWhereInput = {};
    if (villageId) where.booth = { villageId };

    const [data, total] = await Promise.all([
      this.prisma.boothVoterStrength.findMany({
        where,
        include: {
          booth: {
            select: {
              id: true,
              number: true,
              name: true,
              village: { select: { name: true } },
            },
          },
        },
        orderBy: { priorityBoothScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.boothVoterStrength.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listDuplicates(query: DuplicateQueryDto) {
    const { page, limit, status } = query;
    const where: Prisma.VoterDuplicateCandidateWhereInput = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.voterDuplicateCandidate.findMany({
        where,
        include: {
          citizenA: { select: { id: true, name: true, mobile: true, voterId: true } },
          citizenB: { select: { id: true, name: true, mobile: true, voterId: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
        orderBy: { matchScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.voterDuplicateCandidate.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async reviewDuplicate(id: string, dto: ReviewDuplicateDto, user: AuthenticatedUser) {
    return this.prisma.voterDuplicateCandidate.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });
  }

  async detectDuplicates() {
    const citizens = await this.prisma.citizen.findMany({
      where: { voterId: { not: null } },
      select: { id: true, voterId: true, mobile: true, name: true, boothId: true },
      take: 500,
    });

    let created = 0;
    const epicMap = new Map<string, string>();
    for (const c of citizens) {
      if (!c.voterId) continue;
      const epic = c.voterId.toUpperCase();
      const otherId = epicMap.get(epic);
      if (otherId) {
        const [a, b] = otherId < c.id ? [otherId, c.id] : [c.id, otherId];
        try {
          await this.prisma.voterDuplicateCandidate.upsert({
            where: { citizenIdA_citizenIdB: { citizenIdA: a, citizenIdB: b } },
            update: {},
            create: {
              citizenIdA: a,
              citizenIdB: b,
              matchScore: 95,
              matchReason: 'Duplicate EPIC/voter ID',
            },
          });
          created++;
        } catch {
          /* skip */
        }
      } else {
        epicMap.set(epic, c.id);
      }
    }

    // Mobile duplicates
    const mobileGroups = await this.prisma.citizen.groupBy({
      by: ['mobile'],
      where: { mobile: { not: null } },
      _count: { _all: true },
    });
    for (const g of mobileGroups) {
      if (!g.mobile || g._count._all < 2) continue;
      const group = await this.prisma.citizen.findMany({
        where: { mobile: g.mobile },
        select: { id: true },
        take: 5,
      });
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const [a, b] = group[i].id < group[j].id ? [group[i].id, group[j].id] : [group[j].id, group[i].id];
          try {
            await this.prisma.voterDuplicateCandidate.upsert({
              where: { citizenIdA_citizenIdB: { citizenIdA: a, citizenIdB: b } },
              update: {},
              create: {
                citizenIdA: a,
                citizenIdB: b,
                matchScore: 80,
                matchReason: 'Same mobile number',
              },
            });
            created++;
          } catch {
            /* skip */
          }
        }
      }
    }
    return { scanned: citizens.length, pairsCreatedOrFound: created };
  }

  async importRoll(dto: ImportRollDto, user: AuthenticatedUser) {
    const batch = await this.prisma.voterImportBatch.create({
      data: {
        fileName: dto.fileName,
        status: 'Processing',
        createdById: user.id,
      },
    });

    let matched = 0;
    let unmatched = 0;
    const entries = dto.entries ?? [];

    for (const row of entries) {
      const citizen = await this.prisma.citizen.findFirst({
        where: { voterId: { equals: row.epicNo, mode: 'insensitive' } },
      });
      if (citizen) matched++;
      else unmatched++;

      await this.prisma.electoralRollEntry.create({
        data: {
          epicNo: row.epicNo,
          name: row.name,
          relationName: row.relationName,
          age: row.age,
          partNo: row.partNo,
          serialNo: row.serialNo,
          address: row.address,
          boothId: row.boothId,
          importBatchId: batch.id,
          matchedCitizenId: citizen?.id,
        },
      });
    }

    await this.prisma.voterImportBatch.update({
      where: { id: batch.id },
      data: {
        status: 'Completed',
        totalRows: entries.length,
        matchedRows: matched,
        unmatchedRows: unmatched,
      },
    });

    return { batchId: batch.id, totalRows: entries.length, matched, unmatched };
  }

  async syncFromSources() {
    let updated = 0;

    const d2dMembers = await this.prisma.d2DFamilyMember.findMany({
      where: { citizenId: { not: null } },
      include: { citizen: true },
    });
    for (const m of d2dMembers) {
      if (!m.citizenId) continue;
      const preference = mapD2dSentiment(m.votingPreference);
      await this.upsertFromSource(m.citizenId, {
        preference,
        source: 'D2D',
      });
      updated++;
    }

    const outreach = await this.prisma.electionVoterOutreach.findMany({
      where: { citizenId: { not: null } },
    });
    for (const o of outreach) {
      if (!o.citizenId) continue;
      await this.upsertFromSource(o.citizenId, {
        preference: mapVoterStance(o.stance),
        isKeyVoter: o.isKeyVoter,
        isInfluencer: o.isInfluencer,
        source: 'Election',
      });
      updated++;
    }

    return { profilesSynced: updated };
  }

  async exportCsv(type: string) {
    if (type === 'profiles') {
      const rows = await this.prisma.voterIntelligenceProfile.findMany({
        include: {
          citizen: { select: { name: true, voterId: true, mobile: true } },
          segment: { select: { name: true } },
        },
        take: 5000,
      });
      const header = 'Name,VoterID,Mobile,Preference,KeyVoter,Influencer,Swing,PriorityScore,Segment';
      const lines = rows.map((r) =>
        [
          r.citizen.name,
          r.citizen.voterId ?? '',
          r.citizen.mobile ?? '',
          r.preference,
          r.isKeyVoter,
          r.isInfluencer,
          r.isSwing,
          r.priorityScore,
          r.segment?.name ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      return [header, ...lines].join('\n');
    }
    if (type === 'booths') {
      const rows = await this.prisma.boothVoterStrength.findMany({
        include: { booth: { select: { number: true, name: true } } },
      });
      const header = 'BoothNumber,BoothName,Supporters,Neutrals,Opponents,Swing,SupporterPct,Strength,PriorityScore';
      const lines = rows.map((r) =>
        [
          r.booth.number,
          r.booth.name ?? '',
          r.supporterCount,
          r.neutralCount,
          r.opponentCount,
          r.swingCount,
          r.supporterPct,
          r.strengthLabel,
          r.priorityBoothScore,
        ].join(','),
      );
      return [header, ...lines].join('\n');
    }
    return 'type,unsupported';
  }

  private async upsertFromSource(
    citizenId: string,
    data: {
      preference?: VoterPreference;
      isKeyVoter?: boolean;
      isInfluencer?: boolean;
      source: 'D2D' | 'Election';
    },
  ) {
    const existing = await this.prisma.voterIntelligenceProfile.findUnique({ where: { citizenId } });
    const preference = data.preference ?? existing?.preference ?? VoterPreference.Unknown;
    const isKeyVoter = data.isKeyVoter ?? existing?.isKeyVoter ?? false;
    const isInfluencer = data.isInfluencer ?? existing?.isInfluencer ?? false;
    const isSwing = preference === VoterPreference.Swing || (existing?.isSwing ?? false);
    const priorityScore = computePriorityScore({ isKeyVoter, isInfluencer, isSwing, preference });

    await this.prisma.voterIntelligenceProfile.upsert({
      where: { citizenId },
      create: {
        citizenId,
        preference,
        isKeyVoter,
        isInfluencer,
        isSwing,
        source: data.source,
        priorityScore,
        lastAssessedAt: new Date(),
      },
      update: {
        preference,
        isKeyVoter,
        isInfluencer,
        isSwing,
        source: data.source,
        priorityScore,
        lastAssessedAt: new Date(),
      },
    });

    const citizen = await this.prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { familyId: true, boothId: true },
    });
    if (citizen) {
      await this.recomputeFamilyPreference(citizen.familyId);
      await this.recomputeBoothStrength(citizen.boothId);
    }
  }

  private async recomputeFamilyPreference(familyId: string | null | undefined) {
    if (!familyId) return;
    const members = await this.prisma.voterIntelligenceProfile.findMany({
      where: { citizen: { familyId } },
      select: { preference: true },
    });
    if (!members.length) return;

    const counts = { supporter: 0, neutral: 0, opponent: 0, swing: 0 };
    for (const m of members) {
      if (m.preference === VoterPreference.Supporter) counts.supporter++;
      else if (m.preference === VoterPreference.Neutral) counts.neutral++;
      else if (m.preference === VoterPreference.Opponent) counts.opponent++;
      else if (m.preference === VoterPreference.Swing) counts.swing++;
    }
    const dominant =
      counts.supporter >= counts.neutral && counts.supporter >= counts.opponent
        ? VoterPreference.Supporter
        : counts.opponent >= counts.neutral
          ? VoterPreference.Opponent
          : counts.neutral > 0
            ? VoterPreference.Neutral
            : VoterPreference.Unknown;

    await this.prisma.familyVoterPreference.upsert({
      where: { familyId },
      create: {
        familyId,
        dominantPreference: dominant,
        supporterCount: counts.supporter,
        neutralCount: counts.neutral,
        opponentCount: counts.opponent,
        swingCount: counts.swing,
        memberCount: members.length,
      },
      update: {
        dominantPreference: dominant,
        supporterCount: counts.supporter,
        neutralCount: counts.neutral,
        opponentCount: counts.opponent,
        swingCount: counts.swing,
        memberCount: members.length,
      },
    });
  }

  private async recomputeBoothStrength(boothId: string | null | undefined) {
    if (!boothId) return;
    const profiles = await this.prisma.voterIntelligenceProfile.findMany({
      where: { citizen: { boothId } },
      select: { preference: true },
    });
    if (!profiles.length) return;

    let supporterCount = 0;
    let neutralCount = 0;
    let opponentCount = 0;
    let swingCount = 0;
    for (const p of profiles) {
      if (p.preference === VoterPreference.Supporter) supporterCount++;
      else if (p.preference === VoterPreference.Neutral) neutralCount++;
      else if (p.preference === VoterPreference.Opponent) opponentCount++;
      else if (p.preference === VoterPreference.Swing) swingCount++;
    }
    const total = profiles.length;
    const supporterPct = total ? (supporterCount / total) * 100 : 0;
    let strengthLabel: BoothStrength = BoothStrength.Weak;
    if (supporterPct >= 60) strengthLabel = BoothStrength.Strong;
    else if (supporterPct >= 40) strengthLabel = BoothStrength.Swing;
    const priorityBoothScore = Math.round(supporterPct + swingCount * 5);

    await this.prisma.boothVoterStrength.upsert({
      where: { boothId },
      create: {
        boothId,
        supporterCount,
        neutralCount,
        opponentCount,
        swingCount,
        totalProfiles: total,
        supporterPct,
        strengthLabel,
        priorityBoothScore,
      },
      update: {
        supporterCount,
        neutralCount,
        opponentCount,
        swingCount,
        totalProfiles: total,
        supporterPct,
        strengthLabel,
        priorityBoothScore,
      },
    });

    await this.prisma.booth.update({
      where: { id: boothId },
      data: { voterCount: total },
    });
  }

  private async logChange(profileId: string, userId: string, field: string, oldValue: string | null, newValue: string) {
    await this.prisma.voterIntelligenceChangeLog.create({
      data: {
        profileId,
        userId,
        field,
        oldValue,
        newValue,
        summary: `${field}: ${oldValue ?? '—'} → ${newValue}`,
      },
    });
  }
}
