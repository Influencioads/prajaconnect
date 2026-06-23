import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { CadreQueryDto, CreateCadreDto, UpdateCadreDto } from './dto/cadre.dto';

const cadreListInclude = {
  mandal: { select: { id: true, name: true } },
  constituency: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  parent: { select: { id: true, name: true, designation: true } },
  _count: { select: { children: true, assignedGrievances: true } },
} satisfies Prisma.CadreInclude;

@Injectable()
export class CadreService {
  constructor(private prisma: PrismaService) {}

  async list(query: CadreQueryDto) {
    const { page, limit, search, status, level, mandalId, boothId, constituencyId } = query;
    const where: Prisma.CadreWhereInput = {};
    if (status) where.status = status;
    if (level) where.level = level;
    if (mandalId) where.mandalId = mandalId;
    if (boothId) where.boothId = boothId;
    if (constituencyId) where.constituencyId = constituencyId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.cadre.findMany({
        where,
        include: cadreListInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cadre.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  async stats() {
    const [total, active, onLeave, inactive] = await Promise.all([
      this.prisma.cadre.count(),
      this.prisma.cadre.count({ where: { status: 'Active' } }),
      this.prisma.cadre.count({ where: { status: 'OnLeave' } }),
      this.prisma.cadre.count({ where: { status: 'Inactive' } }),
    ]);
    return { total, active, onLeave, inactive };
  }

  async get(id: string) {
    const cadre = await this.prisma.cadre.findUnique({
      where: { id },
      include: {
        mandal: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        booth: { select: { id: true, number: true, name: true } },
        parent: { select: { id: true, name: true, designation: true, level: true } },
        children: {
          select: { id: true, name: true, designation: true, level: true, status: true, mobile: true },
          orderBy: { name: 'asc' },
        },
        assignedGrievances: {
          select: { id: true, code: true, title: true, status: true, priority: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        organizedEvents: {
          select: { id: true, title: true, type: true, status: true, startAt: true },
          orderBy: { startAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!cadre) throw new NotFoundException('Cadre not found');
    return cadre;
  }

  async create(dto: CreateCadreDto) {
    return this.prisma.cadre.create({ data: { ...dto }, include: cadreListInclude });
  }

  async update(id: string, dto: UpdateCadreDto) {
    await this.ensureExists(id);
    return this.prisma.cadre.update({ where: { id }, data: { ...dto }, include: cadreListInclude });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.cadre.update({ where: { id }, data: { parentId: null } });
    await this.prisma.cadre.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await this.prisma.cadre.delete({ where: { id } });
    return { success: true };
  }

  async hierarchy() {
    const all = await this.prisma.cadre.findMany({
      select: {
        id: true,
        name: true,
        designation: true,
        level: true,
        status: true,
        parentId: true,
        mandal: { select: { name: true } },
        booth: { select: { number: true } },
        _count: { select: { children: true } },
      },
      orderBy: { level: 'desc' },
    });

    type Node = (typeof all)[number] & { children: Node[] };
    const map = new Map<string, Node>();
    all.forEach((c) => map.set(c.id, { ...c, children: [] }));
    const roots: Node[] = [];
    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  async parentOptions(excludeId?: string) {
    const cadres = await this.prisma.cadre.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      select: { id: true, name: true, designation: true, level: true },
      orderBy: { name: 'asc' },
    });
    return cadres;
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.cadre.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Cadre not found');
  }
}
