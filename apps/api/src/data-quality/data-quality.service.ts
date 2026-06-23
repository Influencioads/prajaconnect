import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MergeSuggestionStatus, Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

function normalizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function normalizeAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .split(',')
    .map((p) => p.trim().replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(', ');
}

function similarity(a: string, b: string): number {
  const x = a.toLowerCase().trim();
  const y = b.toLowerCase().trim();
  if (!x || !y) return 0;
  if (x === y) return 1;
  const longer = x.length >= y.length ? x : y;
  const shorter = x.length >= y.length ? y : x;
  if (longer.includes(shorter)) return 0.85;
  const wordsA = new Set(x.split(/\s+/));
  const wordsB = new Set(y.split(/\s+/));
  let overlap = 0;
  for (const w of wordsA) if (wordsB.has(w)) overlap++;
  return overlap / Math.max(wordsA.size, wordsB.size);
}

@Injectable()
export class DataQualityService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [
      openIssues,
      resolvedIssues,
      pendingMerges,
      approvedMerges,
      recentIssues,
      byType,
      addressLogs,
      mobileLogs,
      citizenCount,
      duplicateMobileIssues,
    ] = await Promise.all([
      this.prisma.dataQualityIssue.count({ where: { resolved: false } }),
      this.prisma.dataQualityIssue.count({ where: { resolved: true } }),
      this.prisma.profileMergeSuggestion.count({
        where: { status: MergeSuggestionStatus.Pending },
      }),
      this.prisma.profileMergeSuggestion.count({
        where: { status: MergeSuggestionStatus.Approved },
      }),
      this.prisma.dataQualityIssue.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dataQualityIssue.groupBy({
        by: ['issueType'],
        _count: { _all: true },
        where: { resolved: false },
      }),
      this.prisma.addressNormalizationLog.count(),
      this.prisma.mobileValidationLog.count({ where: { valid: false } }),
      this.prisma.citizen.count(),
      this.prisma.dataQualityIssue.count({
        where: { issueType: 'DuplicateMobile', resolved: false },
      }),
    ]);

    const qualityScore =
      citizenCount > 0
        ? Math.max(0, Math.round(100 - (openIssues / citizenCount) * 100))
        : 100;

    return {
      openIssues,
      resolvedIssues,
      pendingMerges,
      approvedMerges,
      recentIssues,
      byType,
      metrics: {
        citizenCount,
        qualityScore,
        addressNormalizations: addressLogs,
        invalidMobiles: mobileLogs,
        duplicateMobileIssues,
      },
    };
  }

  async listIssues(query: PaginationDto, resolved?: boolean) {
    const { page, limit, search } = query;
    const where: Prisma.DataQualityIssueWhereInput = {};
    if (resolved !== undefined) where.resolved = resolved;
    if (search) {
      where.OR = [
        { entityType: { contains: search, mode: 'insensitive' } },
        { issueType: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.dataQualityIssue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dataQualityIssue.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async resolveIssue(id: string) {
    return this.prisma.dataQualityIssue.update({
      where: { id },
      data: { resolved: true },
    });
  }

  async listMergeSuggestions(query: PaginationDto, status?: string) {
    const { page, limit } = query;
    const where: Prisma.ProfileMergeSuggestionWhereInput = {};
    if (status && Object.values(MergeSuggestionStatus).includes(status as MergeSuggestionStatus)) {
      where.status = status as MergeSuggestionStatus;
    }
    const [data, total] = await Promise.all([
      this.prisma.profileMergeSuggestion.findMany({
        where,
        include: {
          reviewedBy: { select: { id: true, name: true } },
        },
        orderBy: { score: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.profileMergeSuggestion.count({ where }),
    ]);

    const enriched = await Promise.all(
      data.map(async (s) => {
        const [citizenA, citizenB] = await Promise.all([
          this.prisma.citizen.findUnique({
            where: { id: s.citizenIdA },
            select: { id: true, name: true, mobile: true, voterId: true },
          }),
          this.prisma.citizen.findUnique({
            where: { id: s.citizenIdB },
            select: { id: true, name: true, mobile: true, voterId: true },
          }),
        ]);
        return { ...s, citizenA, citizenB };
      }),
    );

    return { data: enriched, meta: paginate(page, limit, total) };
  }

  async reviewMergeSuggestion(id: string, status: string, userId: string) {
    const normalized = status as MergeSuggestionStatus;
    return this.prisma.profileMergeSuggestion.update({
      where: { id },
      data: {
        status: normalized,
        reviewedById: userId,
      },
      include: { reviewedBy: { select: { id: true, name: true } } },
    });
  }

  async executeMerge(id: string, userId: string) {
    const suggestion = await this.prisma.profileMergeSuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException('Merge suggestion not found');
    if (suggestion.status === MergeSuggestionStatus.Rejected) {
      throw new BadRequestException('Cannot merge a rejected suggestion');
    }

    const keepId = suggestion.citizenIdA;
    const mergeId = suggestion.citizenIdB;

    const [keep, merge] = await Promise.all([
      this.prisma.citizen.findUnique({ where: { id: keepId } }),
      this.prisma.citizen.findUnique({ where: { id: mergeId } }),
    ]);
    if (!keep || !merge) throw new NotFoundException('Citizen not found');

    await this.prisma.$transaction([
      this.prisma.grievance.updateMany({ where: { citizenId: mergeId }, data: { citizenId: keepId } }),
      this.prisma.temporaryGrievance.updateMany({ where: { citizenId: mergeId }, data: { citizenId: keepId } }),
      this.prisma.activity.updateMany({ where: { citizenId: mergeId }, data: { citizenId: keepId } }),
      this.prisma.citizen.update({
        where: { id: keepId },
        data: {
          mobile: keep.mobile ?? merge.mobile,
          voterId: keep.voterId ?? merge.voterId,
          address: keep.address ?? merge.address,
          notes: [keep.notes, merge.notes].filter(Boolean).join(' | ') || keep.notes,
        },
      }),
      this.prisma.citizen.delete({ where: { id: mergeId } }),
      this.prisma.profileMergeSuggestion.update({
        where: { id },
        data: { status: MergeSuggestionStatus.Approved, reviewedById: userId },
      }),
      this.prisma.dataQualityIssue.updateMany({
        where: { entityId: mergeId, entityType: 'Citizen' },
        data: { resolved: true },
      }),
    ]);

    return { success: true, keptCitizenId: keepId, mergedCitizenId: mergeId };
  }

  async detectCitizenDuplicates() {
    const citizens = await this.prisma.citizen.findMany({
      select: { id: true, name: true, mobile: true, voterId: true },
      take: 2000,
    });

    const issuesCreated: string[] = [];
    const suggestionsCreated: string[] = [];
    const seenPairs = new Set<string>();

    for (let i = 0; i < citizens.length; i++) {
      for (let j = i + 1; j < citizens.length; j++) {
        const a = citizens[i];
        const b = citizens[j];
        const pairKey = [a.id, b.id].sort().join(':');
        if (seenPairs.has(pairKey)) continue;

        let score = 0;
        let issueType = '';

        if (a.mobile && b.mobile && normalizeMobile(a.mobile) === normalizeMobile(b.mobile)) {
          score = 0.95;
          issueType = 'DuplicateMobile';
        } else if (a.voterId && b.voterId && a.voterId === b.voterId) {
          score = 0.98;
          issueType = 'DuplicateVoterId';
        } else {
          const nameScore = similarity(a.name, b.name);
          if (nameScore >= 0.85 && a.mobile && b.mobile) {
            score = nameScore * 0.8;
            issueType = 'SimilarNameAndMobile';
          } else if (nameScore >= 0.92) {
            score = nameScore * 0.7;
            issueType = 'SimilarName';
          }
        }

        if (score < 0.7) continue;
        seenPairs.add(pairKey);

        const existingSuggestion = await this.prisma.profileMergeSuggestion.findFirst({
          where: {
            OR: [
              { citizenIdA: a.id, citizenIdB: b.id },
              { citizenIdA: b.id, citizenIdB: a.id },
            ],
          },
        });

        if (!existingSuggestion) {
          const s = await this.prisma.profileMergeSuggestion.create({
            data: { citizenIdA: a.id, citizenIdB: b.id, score },
          });
          suggestionsCreated.push(s.id);
        }

        for (const cid of [a.id, b.id]) {
          const exists = await this.prisma.dataQualityIssue.findFirst({
            where: { entityType: 'Citizen', entityId: cid, issueType, resolved: false },
          });
          if (!exists) {
            const issue = await this.prisma.dataQualityIssue.create({
              data: { entityType: 'Citizen', entityId: cid, issueType, score },
            });
            issuesCreated.push(issue.id);
          }
        }
      }
    }

    return {
      pairsScanned: seenPairs.size,
      issuesCreated: issuesCreated.length,
      suggestionsCreated: suggestionsCreated.length,
    };
  }

  async detectGrievanceDuplicates() {
    const grievances = await this.prisma.grievance.findMany({
      select: { id: true, title: true, description: true, citizenId: true },
      take: 2000,
      orderBy: { createdAt: 'desc' },
    });

    let issuesCreated = 0;
    const seen = new Set<string>();

    for (let i = 0; i < grievances.length; i++) {
      for (let j = i + 1; j < grievances.length; j++) {
        const a = grievances[i];
        const b = grievances[j];
        if (a.citizenId !== b.citizenId || !a.citizenId) continue;
        const textA = `${a.title} ${a.description ?? ''}`;
        const textB = `${b.title} ${b.description ?? ''}`;
        const score = similarity(textA, textB);
        if (score < 0.8) continue;
        const key = [a.id, b.id].sort().join(':');
        if (seen.has(key)) continue;
        seen.add(key);

        for (const gid of [a.id, b.id]) {
          const exists = await this.prisma.dataQualityIssue.findFirst({
            where: { entityType: 'Grievance', entityId: gid, issueType: 'DuplicateGrievance', resolved: false },
          });
          if (!exists) {
            await this.prisma.dataQualityIssue.create({
              data: { entityType: 'Grievance', entityId: gid, issueType: 'DuplicateGrievance', score },
            });
            issuesCreated++;
          }
        }
      }
    }

    return { pairsFound: seen.size, issuesCreated };
  }

  async checkCitizenDuplicate(mobile?: string, name?: string) {
    const warnings: { citizenId: string; name: string; mobile?: string | null; score: number; reason: string }[] = [];

    if (mobile) {
      const norm = normalizeMobile(mobile);
      const matches = await this.prisma.citizen.findMany({
        where: { mobile: { contains: norm.slice(-10) } },
        select: { id: true, name: true, mobile: true },
        take: 5,
      });
      for (const m of matches) {
        if (m.mobile && normalizeMobile(m.mobile) === norm) {
          warnings.push({ citizenId: m.id, name: m.name, mobile: m.mobile, score: 0.95, reason: 'Duplicate mobile' });
        }
      }
    }

    if (name && name.trim().length >= 3) {
      const matches = await this.prisma.citizen.findMany({
        where: { name: { contains: name.trim(), mode: 'insensitive' } },
        select: { id: true, name: true, mobile: true },
        take: 5,
      });
      for (const m of matches) {
        const score = similarity(name, m.name);
        if (score >= 0.85 && !warnings.some((w) => w.citizenId === m.id)) {
          warnings.push({ citizenId: m.id, name: m.name, mobile: m.mobile, score, reason: 'Similar name' });
        }
      }
    }

    const readOnly = warnings.some((w) => w.reason === 'Duplicate mobile' && w.score >= 0.95);
    return { hasDuplicate: warnings.length > 0, readOnly, warnings };
  }

  async normalizeAddress(body: { citizenId: string; address: string }) {
    const normalized = normalizeAddress(body.address);
    const log = await this.prisma.addressNormalizationLog.create({
      data: { citizenId: body.citizenId, original: body.address, normalized },
    });
    await this.prisma.citizen.update({
      where: { id: body.citizenId },
      data: { address: normalized },
    });
    return log;
  }

  async validateMobile(body: { mobile: string; citizenId?: string }) {
    const normalized = normalizeMobile(body.mobile);
    const valid = normalized.length === 10 && /^[6-9]/.test(normalized);
    const duplicate =
      valid &&
      (await this.prisma.citizen.findFirst({
        where: {
          mobile: { contains: normalized },
          ...(body.citizenId ? { NOT: { id: body.citizenId } } : {}),
        },
      }));

    const log = await this.prisma.mobileValidationLog.create({
      data: { mobile: body.mobile, valid: valid && !duplicate },
    });

    return {
      valid: valid && !duplicate,
      normalized,
      duplicate: duplicate ? { id: duplicate.id, name: duplicate.name } : null,
      log,
    };
  }

  async exportCsv(type: string) {
    if (type === 'issues') {
      const rows = await this.prisma.dataQualityIssue.findMany({ take: 5000, orderBy: { createdAt: 'desc' } });
      const header = 'entityType,entityId,issueType,score,resolved,createdAt';
      return [
        header,
        ...rows.map(
          (r) => `"${r.entityType}","${r.entityId}","${r.issueType}",${r.score},${r.resolved},${r.createdAt.toISOString()}`,
        ),
      ].join('\n');
    }
    if (type === 'merges') {
      const rows = await this.prisma.profileMergeSuggestion.findMany({ take: 5000, orderBy: { score: 'desc' } });
      const header = 'citizenIdA,citizenIdB,score,status,createdAt';
      return [
        header,
        ...rows.map(
          (r) => `"${r.citizenIdA}","${r.citizenIdB}",${r.score},"${r.status}",${r.createdAt.toISOString()}`,
        ),
      ].join('\n');
    }
    if (type === 'quality') {
      const dash = await this.dashboard();
      const header = 'metric,value';
      return [
        header,
        `qualityScore,${dash.metrics.qualityScore}`,
        `openIssues,${dash.openIssues}`,
        `pendingMerges,${dash.pendingMerges}`,
        `citizenCount,${dash.metrics.citizenCount}`,
        `invalidMobiles,${dash.metrics.invalidMobiles}`,
      ].join('\n');
    }
    return 'type,unsupported';
  }
}
