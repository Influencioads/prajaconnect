import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import {
  CitizenQueryDto,
  CreateCitizenDto,
  CreateFamilyDto,
  UpdateCitizenDto,
} from './dto/citizen.dto';

const citizenListInclude = {
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  family: { select: { id: true, headName: true } },
  _count: { select: { grievances: true, beneficiaries: true } },
} satisfies Prisma.CitizenInclude;

function parseDob(dob?: string): Date | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@Injectable()
export class CitizensService {
  constructor(private prisma: PrismaService) {}

  async list(query: CitizenQueryDto) {
    const { page, limit, search, status, gender, mandalId, villageId, boothId, familyId } = query;
    const where: Prisma.CitizenWhereInput = {};
    if (status) where.status = status;
    if (gender) where.gender = gender;
    if (mandalId) where.mandalId = mandalId;
    if (villageId) where.villageId = villageId;
    if (boothId) where.boothId = boothId;
    if (familyId) where.familyId = familyId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { voterId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.citizen.findMany({
        where,
        include: citizenListInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.citizen.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const [total, active, male, female, families] = await Promise.all([
      this.prisma.citizen.count(),
      this.prisma.citizen.count({ where: { status: 'Active' } }),
      this.prisma.citizen.count({ where: { gender: 'Male' } }),
      this.prisma.citizen.count({ where: { gender: 'Female' } }),
      this.prisma.family.count(),
    ]);
    return { total, active, male, female, families };
  }

  async get(id: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id },
      include: {
        mandal: { select: { id: true, name: true } },
        village: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        booth: { select: { id: true, number: true, name: true } },
        family: {
          select: {
            id: true,
            headName: true,
            address: true,
            rationCard: true,
            members: {
              select: { id: true, name: true, gender: true, age: true, isFamilyHead: true },
              orderBy: { isFamilyHead: 'desc' },
            },
          },
        },
        grievances: {
          select: { id: true, code: true, title: true, status: true, priority: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        beneficiaries: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            disbursedAmount: true,
            scheme: { select: { id: true, name: true, code: true } },
          },
          orderBy: { appliedAt: 'desc' },
        },
        eventAttendees: {
          select: {
            id: true,
            checkedInAt: true,
            event: { select: { id: true, title: true, startAt: true } },
          },
          orderBy: { id: 'desc' },
          take: 10,
        },
      },
    });
    if (!citizen) throw new NotFoundException('Citizen not found');
    return citizen;
  }

  async create(dto: CreateCitizenDto) {
    const { dob, ...rest } = dto;
    return this.prisma.citizen.create({
      data: { ...rest, dob: parseDob(dob) },
      include: citizenListInclude,
    });
  }

  async update(id: string, dto: UpdateCitizenDto) {
    await this.ensureExists(id);
    const { dob, ...rest } = dto;
    return this.prisma.citizen.update({
      where: { id },
      data: { ...rest, ...(dob !== undefined ? { dob: parseDob(dob) } : {}) },
      include: citizenListInclude,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.citizen.delete({ where: { id } });
    return { success: true };
  }

  async families(search?: string) {
    return this.prisma.family.findMany({
      where: search ? { headName: { contains: search, mode: 'insensitive' } } : undefined,
      select: {
        id: true,
        headName: true,
        address: true,
        rationCard: true,
        _count: { select: { members: true } },
      },
      orderBy: { headName: 'asc' },
      take: 100,
    });
  }

  async createFamily(dto: CreateFamilyDto) {
    return this.prisma.family.create({ data: { ...dto } });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.citizen.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Citizen not found');
  }
}
