import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { NotificationType, UserRole } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import {
  AdvanceStageDto,
  CreateFundSourceDto,
  CreateFundWorkDto,
  CreateInstallmentDto,
  FUND_STAGES,
  FundWorkQueryDto,
  UpdateFundSourceDto,
  UpdateFundWorkDto,
} from './dto/funds.dto';

const MS_PER_DAY = 86400000;

const LEADER_ROLES: UserRole[] = [
  UserRole.SuperAdmin,
  UserRole.StateLeader,
  UserRole.DistrictLeader,
  UserRole.ConstituencyIncharge,
];

const SANCTIONED_STAGES = ['Sanctioned', 'Released', 'Completed', 'UCSubmitted'];

const workInclude = {
  fundSource: { select: { id: true, name: true, financialYear: true } },
  project: { select: { id: true, name: true, progressPct: true } },
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
} satisfies Prisma.FundWorkInclude;

/** End of an Indian financial year like "2026-27" → 31 March 2027. */
export function fyEndDate(financialYear: string): Date | null {
  const m = financialYear.match(/(\d{4})/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10) + 1, 2, 31, 23, 59, 59);
}

@Injectable()
export class FundsService {
  private readonly logger = new Logger(FundsService.name);

  constructor(
    private prisma: PrismaService,
    private dispatch: NotificationDispatchService,
  ) {}

  // ---------- sources ----------

  listSources() {
    return this.prisma.fundSource.findMany({
      include: { _count: { select: { works: true } } },
      orderBy: [{ active: 'desc' }, { financialYear: 'desc' }],
    });
  }

  createSource(dto: CreateFundSourceDto) {
    return this.prisma.fundSource.create({ data: dto });
  }

  async updateSource(id: string, dto: UpdateFundSourceDto) {
    const found = await this.prisma.fundSource.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Fund source not found');
    return this.prisma.fundSource.update({ where: { id }, data: dto });
  }

  // ---------- works ----------

  async listWorks(query: FundWorkQueryDto) {
    const { page, limit, search, fundSourceId, stage, mandalId } = query;
    const where: Prisma.FundWorkWhereInput = {};
    if (fundSourceId) where.fundSourceId = fundSourceId;
    if (stage) where.stage = stage;
    if (mandalId) where.mandalId = mandalId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.fundWork.findMany({
        where,
        include: workInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fundWork.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getWork(id: string) {
    const work = await this.prisma.fundWork.findUnique({
      where: { id },
      include: { ...workInclude, installments: { orderBy: { releasedAt: 'desc' } } },
    });
    if (!work) throw new NotFoundException('Fund work not found');
    return work;
  }

  createWork(dto: CreateFundWorkDto) {
    return this.prisma.fundWork.create({
      data: { ...dto, recommendedAt: new Date() },
      include: workInclude,
    });
  }

  async updateWork(id: string, dto: UpdateFundWorkDto) {
    await this.getWork(id);
    return this.prisma.fundWork.update({ where: { id }, data: dto, include: workInclude });
  }

  /** Move a work to a stage, stamping the matching date fields. */
  async advanceStage(id: string, dto: AdvanceStageDto) {
    const work = await this.getWork(id);
    if (FUND_STAGES.indexOf(dto.stage) < FUND_STAGES.indexOf(work.stage as (typeof FUND_STAGES)[number])) {
      throw new BadRequestException(`Cannot move back from ${work.stage} to ${dto.stage}`);
    }

    const now = new Date();
    const data: Prisma.FundWorkUpdateInput = { stage: dto.stage };
    if (dto.stage === 'Recommended' && !work.recommendedAt) data.recommendedAt = now;
    if (dto.stage === 'Sanctioned') {
      if (!work.sanctionedAt) data.sanctionedAt = now;
      if (dto.sanctionNo) data.sanctionNo = dto.sanctionNo;
    }
    if (dto.stage === 'UCSubmitted' && !work.ucSubmittedAt) data.ucSubmittedAt = now;

    if (dto.stage === 'Released' && dto.amount && dto.amount > 0) {
      data.releasedAmount = { increment: dto.amount };
      data.installments = { create: { amount: dto.amount, reference: dto.reference, releasedAt: now } };
    }

    return this.prisma.fundWork.update({ where: { id }, data, include: workInclude });
  }

  /** Record a fund release installment against a work. */
  async addInstallment(workId: string, dto: CreateInstallmentDto) {
    const work = await this.getWork(workId);
    const stage = ['Recommended', 'Sanctioned'].includes(work.stage) ? 'Released' : work.stage;
    return this.prisma.fundWork.update({
      where: { id: workId },
      data: {
        stage,
        releasedAmount: { increment: dto.amount },
        installments: {
          create: {
            amount: dto.amount,
            reference: dto.reference,
            releasedAt: dto.releasedAt ? new Date(dto.releasedAt) : new Date(),
          },
        },
      },
      include: { ...workInclude, installments: { orderBy: { releasedAt: 'desc' } } },
    });
  }

  // ---------- dashboard ----------

  async dashboard() {
    const sources = await this.prisma.fundSource.findMany({
      orderBy: [{ active: 'desc' }, { financialYear: 'desc' }],
      include: {
        works: {
          select: { estimatedCost: true, stage: true, releasedAmount: true, ucSubmittedAt: true },
        },
      },
    });

    const now = new Date();
    const perSource = sources.map((s) => {
      const allocated = Number(s.allocated);
      const recommended = s.works.reduce((sum, w) => sum + Number(w.estimatedCost), 0);
      const sanctioned = s.works
        .filter((w) => SANCTIONED_STAGES.includes(w.stage))
        .reduce((sum, w) => sum + Number(w.estimatedCost), 0);
      const released = s.works.reduce((sum, w) => sum + Number(w.releasedAmount), 0);
      const ucSubmitted = s.works
        .filter((w) => w.ucSubmittedAt)
        .reduce((sum, w) => sum + Number(w.releasedAmount), 0);
      const unspent = allocated - released;
      const fyEnd = fyEndDate(s.financialYear);
      const daysToFyEnd = fyEnd ? Math.max(0, Math.ceil((fyEnd.getTime() - now.getTime()) / MS_PER_DAY)) : null;
      const byStage: Record<string, number> = {};
      for (const stage of FUND_STAGES) byStage[stage] = s.works.filter((w) => w.stage === stage).length;
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        financialYear: s.financialYear,
        active: s.active,
        works: s.works.length,
        allocated,
        recommended,
        sanctioned,
        released,
        ucSubmitted,
        unspent,
        utilizationPct: allocated ? Math.round((released / allocated) * 100) : 0,
        daysToFyEnd,
        byStage,
      };
    });

    return {
      sources: perSource,
      totals: {
        allocated: perSource.reduce((s, x) => s + x.allocated, 0),
        recommended: perSource.reduce((s, x) => s + x.recommended, 0),
        sanctioned: perSource.reduce((s, x) => s + x.sanctioned, 0),
        released: perSource.reduce((s, x) => s + x.released, 0),
        ucSubmitted: perSource.reduce((s, x) => s + x.ucSubmitted, 0),
        unspent: perSource.reduce((s, x) => s + x.unspent, 0),
        works: perSource.reduce((s, x) => s + x.works, 0),
      },
    };
  }

  // ---------- unspent balance alert ----------

  private async setting(key: string, fallback: string): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row?.value || fallback;
  }

  async isAlertCronEnabled(): Promise<boolean> {
    const val = await this.setting('funds_alert_cron_enabled', process.env.FUNDS_ALERT_CRON_ENABLED ?? 'true');
    return val.toLowerCase() !== 'false';
  }

  async unspentThresholdPct(): Promise<number> {
    const val = await this.setting(
      'funds_unspent_alert_threshold_pct',
      process.env.FUNDS_UNSPENT_ALERT_THRESHOLD_PCT ?? '50',
    );
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : 50;
  }

  /**
   * Warn Leader-role users when a fund source still has more than the
   * threshold % unspent with fewer than 6 months left in its financial year.
   */
  async runUnspentAlert() {
    const threshold = await this.unspentThresholdPct();
    const { sources } = await this.dashboard();
    const atRisk = sources.filter(
      (s) =>
        s.active &&
        s.allocated > 0 &&
        s.daysToFyEnd !== null &&
        s.daysToFyEnd < 183 &&
        (s.unspent / s.allocated) * 100 > threshold,
    );

    if (!atRisk.length) return { checked: sources.length, alerted: 0, notified: 0 };

    const leaders = await this.prisma.user.findMany({
      where: { role: { name: { in: LEADER_ROLES } }, status: 'Active' },
      select: { id: true },
      take: 50,
    });
    if (!leaders.length) {
      this.logger.warn('Fund unspent alert: no active leader users to notify');
      return { checked: sources.length, alerted: atRisk.length, notified: 0 };
    }

    const body = atRisk
      .map(
        (s) =>
          `${s.name}: ₹${Math.round(s.unspent).toLocaleString('en-IN')} unspent (${Math.round(
            (s.unspent / s.allocated) * 100,
          )}%), ${s.daysToFyEnd} days to FY end`,
      )
      .join('\n');

    await this.dispatch.dispatch({
      userIds: leaders.map((u) => u.id),
      type: NotificationType.Warning,
      title: `Fund utilization warning: ${atRisk.length} source(s) under-utilized`,
      body,
      link: '/funds',
    });

    this.logger.log(`Fund unspent alert dispatched for ${atRisk.length} source(s) to ${leaders.length} leader(s)`);
    return { checked: sources.length, alerted: atRisk.length, notified: leaders.length };
  }
}
