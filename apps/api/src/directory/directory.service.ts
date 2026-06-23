import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import {
  CreateDepartmentDto,
  CreateOfficialDto,
  OfficialQueryDto,
  UpdateDepartmentDto,
  UpdateOfficialDto,
} from './dto/directory.dto';

const LEVEL_ORDER = ['Booth', 'Village', 'Mandal', 'Constituency', 'District', 'State'];

@Injectable()
export class DirectoryService {
  constructor(private prisma: PrismaService) {}

  // ----- Departments -----
  async listDepartments() {
    return this.prisma.department.findMany({
      include: { _count: { select: { officials: true, grievances: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { ...dto } });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.ensureDepartment(id);
    return this.prisma.department.update({ where: { id }, data: { ...dto } });
  }

  async removeDepartment(id: string) {
    await this.ensureDepartment(id);
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }

  // ----- Officials -----
  async listOfficials(query: OfficialQueryDto) {
    const { page, limit, search, level, departmentId } = query;
    const where: Prisma.GovernmentOfficialWhereInput = {};
    if (level) where.level = level;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { jurisdiction: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.governmentOfficial.findMany({
        where,
        include: { department: { select: { id: true, name: true } } },
        orderBy: [{ escalationOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.governmentOfficial.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createOfficial(dto: CreateOfficialDto) {
    return this.prisma.governmentOfficial.create({
      data: { ...dto },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async updateOfficial(id: string, dto: UpdateOfficialDto) {
    await this.ensureOfficial(id);
    return this.prisma.governmentOfficial.update({
      where: { id },
      data: { ...dto },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async removeOfficial(id: string) {
    await this.ensureOfficial(id);
    await this.prisma.governmentOfficial.delete({ where: { id } });
    return { success: true };
  }

  // ----- Escalation matrix -----
  async escalationMatrix() {
    const departments = await this.prisma.department.findMany({
      include: {
        officials: {
          orderBy: [{ escalationOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            designation: true,
            level: true,
            mobile: true,
            escalationOrder: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      slaHours: d.slaHours,
      levels: d.officials
        .slice()
        .sort(
          (a, b) =>
            a.escalationOrder - b.escalationOrder ||
            LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
        ),
    }));
  }

  private async ensureDepartment(id: string) {
    const found = await this.prisma.department.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Department not found');
  }

  private async ensureOfficial(id: string) {
    const found = await this.prisma.governmentOfficial.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Official not found');
  }
}
