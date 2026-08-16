import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import {
  CreateSchemeDto,
  EligibilityCheckDto,
  EnrollDto,
  SchemeQueryDto,
  UpdateBeneficiaryDto,
  UpdateSchemeDto,
} from './dto/scheme.dto';
import { EligibilityRule, evaluateEligibility } from './eligibility.util';

@Injectable()
export class SchemesService {
  constructor(private prisma: PrismaService) {}

  async list(query: SchemeQueryDto) {
    const { page, limit, search, status, category } = query;
    const where: Prisma.SchemeWhereInput = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.scheme.findMany({
        where,
        include: { _count: { select: { beneficiaries: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.scheme.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const [schemes, active, beneficiaries, disbursed] = await Promise.all([
      this.prisma.scheme.count(),
      this.prisma.scheme.count({ where: { status: 'Active' } }),
      this.prisma.beneficiary.count(),
      this.prisma.beneficiary.aggregate({ _sum: { disbursedAmount: true } }),
    ]);
    return {
      schemes,
      active,
      beneficiaries,
      disbursedTotal: disbursed._sum.disbursedAmount ?? 0,
    };
  }

  async get(id: string) {
    const scheme = await this.prisma.scheme.findUnique({
      where: { id },
      include: {
        beneficiaries: {
          include: { citizen: { select: { id: true, name: true, mobile: true } } },
          orderBy: { appliedAt: 'desc' },
        },
        _count: { select: { beneficiaries: true } },
      },
    });
    if (!scheme) throw new NotFoundException('Scheme not found');
    return scheme;
  }

  async create(dto: CreateSchemeDto) {
    return this.prisma.scheme.create({
      data: { ...dto, eligibility: (dto.eligibility ?? {}) as Prisma.InputJsonValue },
    });
  }

  async update(id: string, dto: UpdateSchemeDto) {
    await this.ensureScheme(id);
    const { eligibility, ...rest } = dto;
    return this.prisma.scheme.update({
      where: { id },
      data: {
        ...rest,
        ...(eligibility !== undefined
          ? { eligibility: eligibility as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureScheme(id);
    await this.prisma.scheme.delete({ where: { id } });
    return { success: true };
  }

  async enroll(schemeId: string, dto: EnrollDto) {
    await this.ensureScheme(schemeId);
    return this.prisma.beneficiary.upsert({
      where: { schemeId_citizenId: { schemeId, citizenId: dto.citizenId } },
      create: { schemeId, citizenId: dto.citizenId, status: dto.status ?? 'Pending' },
      update: { status: dto.status ?? 'Pending' },
      include: { citizen: { select: { id: true, name: true, mobile: true } } },
    });
  }

  async updateBeneficiary(id: string, dto: UpdateBeneficiaryDto) {
    const found = await this.prisma.beneficiary.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Beneficiary not found');
    const approving = dto.status === 'Enrolled' || dto.status === 'Disbursed';
    return this.prisma.beneficiary.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.status === 'Disbursed' ? { disbursedAt: new Date() } : {}),
        ...(approving ? { approvedAt: new Date() } : {}),
      },
      include: { citizen: { select: { id: true, name: true } } },
    });
  }

  async checkEligibility(input: EligibilityCheckDto) {
    const schemes = await this.prisma.scheme.findMany({ where: { status: 'Active' } });
    return schemes.map((s) => {
      const rule = (s.eligibility ?? {}) as EligibilityRule;
      const { eligible, reasons } = evaluateEligibility(rule, input);

      return {
        schemeId: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
        benefitAmount: s.benefitAmount,
        eligible,
        reasons,
      };
    });
  }

  private async ensureScheme(id: string) {
    const found = await this.prisma.scheme.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Scheme not found');
  }
}
