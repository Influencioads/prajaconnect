import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { toCsv, fmtCsvDate } from '../common/utils/csv.util';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import { EligibilityRule, evaluateEligibility } from './eligibility.util';
import { MatchQueryDto, UpdateMatchDto } from './dto/scheme-match.dto';

const matchInclude = {
  citizen: {
    select: {
      id: true,
      name: true,
      mobile: true,
      age: true,
      occupation: true,
      village: { select: { id: true, name: true } },
      mandal: { select: { id: true, name: true } },
      booth: { select: { id: true, number: true } },
    },
  },
  assignedCadre: { select: { id: true, name: true, mobile: true } },
} satisfies Prisma.SchemeMatchInclude;

@Injectable()
export class SchemeMatcherService {
  private readonly logger = new Logger(SchemeMatcherService.name);

  constructor(
    private prisma: PrismaService,
    private dispatch: NotificationDispatchService,
  ) {}

  async isEnabled(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'scheme_matcher_enabled' } });
    if (!row) return true;
    return row.value !== 'false' && row.value !== '0';
  }

  /**
   * Evaluate every active scheme's eligibility rule against citizen
   * demographics and upsert SchemeMatch rows. Citizens who are already
   * beneficiaries of a scheme are skipped for that scheme.
   */
  async run() {
    const schemes = await this.prisma.scheme.findMany({ where: { status: 'Active' } });

    // Booth -> cadre lookup (first active cadre assigned to the booth wins).
    const cadres = await this.prisma.cadre.findMany({
      where: { status: 'Active', boothId: { not: null } },
      select: { id: true, userId: true, boothId: true },
    });
    const cadreByBooth = new Map<string, { id: string; userId: string | null }>();
    for (const c of cadres) {
      if (c.boothId && !cadreByBooth.has(c.boothId)) cadreByBooth.set(c.boothId, { id: c.id, userId: c.userId });
    }

    let created = 0;
    let updated = 0;
    let evaluated = 0;
    // cadre userId -> count of newly created matches (for notification)
    const newByCadreUser = new Map<string, number>();

    for (const scheme of schemes) {
      const rule = (scheme.eligibility ?? {}) as EligibilityRule;
      if (Object.keys(rule).length === 0) continue; // open-to-all schemes would match everyone

      // ponytail: loads all non-beneficiary citizens per scheme; batch/cursor if citizen count grows large
      const citizens = await this.prisma.citizen.findMany({
        where: { status: 'Active', beneficiaries: { none: { schemeId: scheme.id } } },
        select: { id: true, age: true, dob: true, occupation: true, boothId: true },
      });
      const existing = new Set(
        (
          await this.prisma.schemeMatch.findMany({
            where: { schemeId: scheme.id },
            select: { citizenId: true },
          })
        ).map((m) => m.citizenId),
      );

      for (const citizen of citizens) {
        evaluated += 1;
        const age =
          citizen.age ??
          (citizen.dob
            ? Math.floor((Date.now() - new Date(citizen.dob).getTime()) / (365.25 * 86400000))
            : undefined);
        const result = evaluateEligibility(rule, {
          age: age ?? undefined,
          occupation: citizen.occupation ?? undefined,
        });
        // Require at least one affirmative criterion so unknown data doesn't match everything.
        if (!result.eligible || result.matched.length === 0) continue;

        const score = Math.round((result.matched.length / Math.max(1, result.totalCriteria)) * 100);
        const cadre = citizen.boothId ? cadreByBooth.get(citizen.boothId) : undefined;
        const matchedOn = { criteria: result.matched, reasons: result.reasons } as Prisma.InputJsonValue;

        await this.prisma.schemeMatch.upsert({
          where: { schemeId_citizenId: { schemeId: scheme.id, citizenId: citizen.id } },
          create: {
            schemeId: scheme.id,
            citizenId: citizen.id,
            score,
            matchedOn,
            assignedCadreId: cadre?.id ?? null,
          },
          update: { score, matchedOn, ...(cadre ? { assignedCadreId: cadre.id } : {}) },
        });

        if (existing.has(citizen.id)) {
          updated += 1;
        } else {
          created += 1;
          if (cadre?.userId) {
            newByCadreUser.set(cadre.userId, (newByCadreUser.get(cadre.userId) ?? 0) + 1);
          }
        }
      }
    }

    for (const [userId, count] of newByCadreUser) {
      try {
        await this.dispatch.dispatch({
          userId,
          type: 'Info',
          title: 'New scheme matches in your booth',
          body: `${count} citizen(s) in your booth look eligible for welfare schemes. Review your worklist.`,
          link: '/camps/worklist',
        });
      } catch (err) {
        this.logger.warn(`Scheme match notification failed for user ${userId}`, err as Error);
      }
    }

    this.logger.log(`Scheme matcher: evaluated ${evaluated}, created ${created}, updated ${updated}`);
    return { schemes: schemes.length, evaluated, created, updated, notifiedCadres: newByCadreUser.size };
  }

  async listMatches(schemeId: string, query: MatchQueryDto) {
    const scheme = await this.prisma.scheme.findUnique({ where: { id: schemeId }, select: { id: true } });
    if (!scheme) throw new NotFoundException('Scheme not found');

    const { page, limit } = query;
    const where = this.matchWhere(schemeId, query);
    const [data, total, byStatus] = await Promise.all([
      this.prisma.schemeMatch.findMany({
        where,
        include: matchInclude,
        orderBy: { score: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.schemeMatch.count({ where }),
      this.prisma.schemeMatch.groupBy({
        by: ['status'],
        where: { schemeId },
        _count: { _all: true },
      }),
    ]);
    return {
      data,
      meta: paginate(page, limit, total),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    };
  }

  async exportMatches(schemeId: string, query: MatchQueryDto) {
    const scheme = await this.prisma.scheme.findUnique({
      where: { id: schemeId },
      select: { id: true, code: true, name: true },
    });
    if (!scheme) throw new NotFoundException('Scheme not found');

    const rows = await this.prisma.schemeMatch.findMany({
      where: this.matchWhere(schemeId, query),
      include: matchInclude,
      orderBy: { score: 'desc' },
    });
    const csv = toCsv(rows, [
      { header: 'Citizen', value: (r) => r.citizen.name },
      { header: 'Mobile', value: (r) => r.citizen.mobile },
      { header: 'Age', value: (r) => r.citizen.age },
      { header: 'Occupation', value: (r) => r.citizen.occupation },
      { header: 'Village', value: (r) => r.citizen.village?.name },
      { header: 'Mandal', value: (r) => r.citizen.mandal?.name },
      { header: 'Booth', value: (r) => r.citizen.booth?.number },
      { header: 'Score', value: (r) => r.score },
      { header: 'Status', value: (r) => r.status },
      { header: 'Assigned Cadre', value: (r) => r.assignedCadre?.name },
      { header: 'Matched At', value: (r) => fmtCsvDate(r.createdAt) },
    ]);
    return { filename: `scheme-matches-${scheme.code}.csv`, csv };
  }

  async updateMatch(id: string, dto: UpdateMatchDto) {
    const found = await this.prisma.schemeMatch.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Match not found');
    return this.prisma.schemeMatch.update({
      where: { id },
      data: dto,
      include: matchInclude,
    });
  }

  /** SchemeMatches for the logged-in cadre (their booth's citizens). */
  async worklist(userId: string, status?: string) {
    const cadre = await this.prisma.cadre.findUnique({
      where: { userId },
      select: { id: true, boothId: true },
    });
    if (!cadre) return { cadre: null, data: [] };

    const data = await this.prisma.schemeMatch.findMany({
      where: {
        ...(status ? { status } : {}),
        OR: [
          { assignedCadreId: cadre.id },
          ...(cadre.boothId ? [{ citizen: { boothId: cadre.boothId } }] : []),
        ],
      },
      include: {
        ...matchInclude,
        scheme: { select: { id: true, name: true, code: true, benefitAmount: true } },
      },
      orderBy: [{ status: 'asc' }, { score: 'desc' }],
      take: 200,
    });
    return { cadre, data };
  }

  private matchWhere(schemeId: string, query: MatchQueryDto): Prisma.SchemeMatchWhereInput {
    const { status, mandalId, villageId } = query;
    return {
      schemeId,
      ...(status ? { status } : {}),
      ...(mandalId || villageId
        ? {
            citizen: {
              ...(mandalId ? { mandalId } : {}),
              ...(villageId ? { villageId } : {}),
            },
          }
        : {}),
    };
  }
}
