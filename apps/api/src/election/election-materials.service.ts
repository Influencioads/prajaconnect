import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ElectionCommonService } from './election-common.service';
import {
  CreateMaterialDto,
  MaterialDistributionDto,
  MaterialQueryDto,
  MaterialReturnDto,
  UpdateMaterialDto,
} from './dto/election.dto';

const materialInclude = {
  _count: { select: { distributions: true } },
} satisfies Prisma.ElectionMaterialInclude;

@Injectable()
export class ElectionMaterialsService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async list(query: MaterialQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const { page, limit, search } = query;
    const where: Prisma.ElectionMaterialWhereInput = { electionId };
    if (query.type) where.type = query.type;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.electionMaterial.findMany({
        where,
        include: materialInclude,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionMaterial.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.electionMaterial.findUnique({
      where: { id },
      include: {
        ...materialInclude,
        distributions: {
          orderBy: { distributedAt: 'desc' },
          take: 20,
          include: {
            mandal: { select: { id: true, name: true } },
            booth: { select: { id: true, number: true } },
            issuedToCadre: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Material not found');
    return row;
  }

  async create(dto: CreateMaterialDto) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    return this.prisma.electionMaterial.create({
      data: {
        electionId,
        type: dto.type,
        name: dto.name,
        stockTotal: dto.stockTotal ?? 0,
        vendorName: dto.vendorName,
        unitCost: dto.unitCost,
        notes: dto.notes,
      },
      include: materialInclude,
    });
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.get(id);
    return this.prisma.electionMaterial.update({
      where: { id },
      data: {
        type: dto.type,
        name: dto.name,
        stockTotal: dto.stockTotal,
        vendorName: dto.vendorName,
        unitCost: dto.unitCost,
        notes: dto.notes,
      },
      include: materialInclude,
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.electionMaterial.delete({ where: { id } });
    return { ok: true };
  }

  async distribute(id: string, dto: MaterialDistributionDto, user: AuthenticatedUser) {
    const material = await this.get(id);
    const available = material.stockTotal - material.stockIssued;
    if (dto.quantity > available) {
      throw new BadRequestException(`Insufficient stock. Available: ${available}`);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.electionMaterial.update({
        where: { id },
        data: { stockIssued: { increment: dto.quantity } },
      });
      return tx.electionMaterialDistribution.create({
        data: {
          materialId: id,
          quantity: dto.quantity,
          mandalId: dto.mandalId,
          villageId: dto.villageId,
          boothId: dto.boothId,
          issuedToCadreId: dto.issuedToCadreId,
          notes: dto.notes,
          createdById: user.id,
        },
      });
    });
  }

  async returnStock(distributionId: string, dto: MaterialReturnDto) {
    const dist = await this.prisma.electionMaterialDistribution.findUnique({
      where: { id: distributionId },
      include: { material: true },
    });
    if (!dist) throw new NotFoundException('Distribution not found');
    const maxReturn = dist.quantity - dist.returnedQty;
    if (dto.returnedQty > maxReturn) {
      throw new BadRequestException(`Cannot return more than ${maxReturn}`);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.electionMaterial.update({
        where: { id: dist.materialId },
        data: { stockIssued: { decrement: dto.returnedQty } },
      });
      return tx.electionMaterialDistribution.update({
        where: { id: distributionId },
        data: {
          returnedQty: { increment: dto.returnedQty },
          returnedAt: new Date(),
        },
      });
    });
  }

  async listDistributions(query: MaterialQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const where: Prisma.ElectionMaterialDistributionWhereInput = {
      material: { electionId },
    };
    const [data, total] = await Promise.all([
      this.prisma.electionMaterialDistribution.findMany({
        where,
        include: {
          material: { select: { id: true, name: true, type: true } },
          mandal: { select: { id: true, name: true } },
          booth: { select: { id: true, number: true } },
          issuedToCadre: { select: { id: true, name: true } },
        },
        orderBy: { distributedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.electionMaterialDistribution.count({ where }),
    ]);
    return { data, meta: paginate(query.page, query.limit, total) };
  }
}
