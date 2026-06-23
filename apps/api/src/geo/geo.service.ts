import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBoothDto,
  CreateConstituencyDto,
  CreateDistrictDto,
  CreateMandalDto,
  CreateStateDto,
  CreateVillageDto,
  UpdateBoothDto,
  UpdateConstituencyDto,
  UpdateDistrictDto,
  UpdateMandalDto,
  UpdateStateDto,
  UpdateVillageDto,
} from './dto/geo.dto';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  // Flat options consumed by every geo dropdown across the app. Keep shape stable.
  async options() {
    const [constituencies, mandals, villages, booths] = await Promise.all([
      this.prisma.constituency.findMany({
        select: { id: true, name: true, districtId: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.mandal.findMany({
        select: { id: true, name: true, constituencyId: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.village.findMany({
        select: { id: true, name: true, mandalId: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.booth.findMany({
        select: { id: true, number: true, name: true, villageId: true },
        orderBy: { number: 'asc' },
      }),
    ]);

    return {
      constituencies,
      mandals,
      villages,
      booths: booths.map((b) => ({
        id: b.id,
        name: b.name ? `${b.number} · ${b.name}` : `Booth ${b.number}`,
        villageId: b.villageId,
      })),
    };
  }

  // ===== Admin management tree (nested hierarchy with dependent counts) =====
  async tree() {
    const states = await this.prisma.state.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { districts: true } },
        districts: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { constituencies: true } },
            constituencies: {
              orderBy: { name: 'asc' },
              include: {
                _count: { select: { mandals: true, users: true, citizens: true, cadres: true } },
                mandals: {
                  orderBy: { name: 'asc' },
                  include: {
                    _count: { select: { villages: true, citizens: true, users: true } },
                    villages: {
                      orderBy: { name: 'asc' },
                      include: {
                        _count: { select: { booths: true, citizens: true } },
                        booths: {
                          orderBy: { number: 'asc' },
                          include: { _count: { select: { citizens: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    return states;
  }

  // ===== State =====
  createState(dto: CreateStateDto) {
    return this.prisma.state.create({ data: { name: dto.name, code: dto.code } });
  }

  async updateState(id: string, dto: UpdateStateDto) {
    await this.ensure('state', id);
    return this.prisma.state.update({ where: { id }, data: { name: dto.name, code: dto.code } });
  }

  async deleteState(id: string) {
    const node = await this.prisma.state.findUnique({
      where: { id },
      select: { _count: { select: { districts: true } } },
    });
    if (!node) throw new NotFoundException('State not found');
    if (node._count.districts > 0) {
      throw new BadRequestException('Remove the districts under this state before deleting it');
    }
    await this.prisma.state.delete({ where: { id } });
    return { success: true };
  }

  // ===== District =====
  async createDistrict(dto: CreateDistrictDto) {
    await this.ensure('state', dto.stateId, 'Parent state does not exist');
    return this.prisma.district.create({
      data: { name: dto.name, code: dto.code, stateId: dto.stateId },
    });
  }

  async updateDistrict(id: string, dto: UpdateDistrictDto) {
    await this.ensure('district', id);
    if (dto.stateId) await this.ensure('state', dto.stateId, 'Parent state does not exist');
    return this.prisma.district.update({
      where: { id },
      data: { name: dto.name, code: dto.code, stateId: dto.stateId },
    });
  }

  async deleteDistrict(id: string) {
    const node = await this.prisma.district.findUnique({
      where: { id },
      select: { _count: { select: { constituencies: true } } },
    });
    if (!node) throw new NotFoundException('District not found');
    if (node._count.constituencies > 0) {
      throw new BadRequestException('Remove the constituencies under this district before deleting it');
    }
    await this.prisma.district.delete({ where: { id } });
    return { success: true };
  }

  // ===== Constituency =====
  async createConstituency(dto: CreateConstituencyDto) {
    await this.ensure('district', dto.districtId, 'Parent district does not exist');
    return this.prisma.constituency.create({
      data: {
        name: dto.name,
        number: dto.number,
        type: dto.type ?? 'Assembly',
        districtId: dto.districtId,
      },
    });
  }

  async updateConstituency(id: string, dto: UpdateConstituencyDto) {
    await this.ensure('constituency', id);
    if (dto.districtId) await this.ensure('district', dto.districtId, 'Parent district does not exist');
    return this.prisma.constituency.update({
      where: { id },
      data: { name: dto.name, number: dto.number, type: dto.type, districtId: dto.districtId },
    });
  }

  async deleteConstituency(id: string) {
    const node = await this.prisma.constituency.findUnique({
      where: { id },
      select: { _count: { select: { mandals: true, users: true, citizens: true, cadres: true } } },
    });
    if (!node) throw new NotFoundException('Constituency not found');
    this.guardDependents('constituency', node._count);
    await this.prisma.constituency.delete({ where: { id } });
    return { success: true };
  }

  // ===== Mandal =====
  async createMandal(dto: CreateMandalDto) {
    await this.ensure('constituency', dto.constituencyId, 'Parent constituency does not exist');
    return this.prisma.mandal.create({
      data: { name: dto.name, constituencyId: dto.constituencyId },
    });
  }

  async updateMandal(id: string, dto: UpdateMandalDto) {
    await this.ensure('mandal', id);
    if (dto.constituencyId)
      await this.ensure('constituency', dto.constituencyId, 'Parent constituency does not exist');
    return this.prisma.mandal.update({
      where: { id },
      data: { name: dto.name, constituencyId: dto.constituencyId },
    });
  }

  async deleteMandal(id: string) {
    const node = await this.prisma.mandal.findUnique({
      where: { id },
      select: { _count: { select: { villages: true, citizens: true, users: true } } },
    });
    if (!node) throw new NotFoundException('Mandal not found');
    this.guardDependents('mandal', node._count);
    await this.prisma.mandal.delete({ where: { id } });
    return { success: true };
  }

  // ===== Village =====
  async createVillage(dto: CreateVillageDto) {
    await this.ensure('mandal', dto.mandalId, 'Parent mandal does not exist');
    return this.prisma.village.create({
      data: { name: dto.name, pincode: dto.pincode, mandalId: dto.mandalId },
    });
  }

  async updateVillage(id: string, dto: UpdateVillageDto) {
    await this.ensure('village', id);
    if (dto.mandalId) await this.ensure('mandal', dto.mandalId, 'Parent mandal does not exist');
    return this.prisma.village.update({
      where: { id },
      data: { name: dto.name, pincode: dto.pincode, mandalId: dto.mandalId },
    });
  }

  async deleteVillage(id: string) {
    const node = await this.prisma.village.findUnique({
      where: { id },
      select: { _count: { select: { booths: true, citizens: true } } },
    });
    if (!node) throw new NotFoundException('Village not found');
    this.guardDependents('village', node._count);
    await this.prisma.village.delete({ where: { id } });
    return { success: true };
  }

  // ===== Booth =====
  async createBooth(dto: CreateBoothDto) {
    await this.ensure('village', dto.villageId, 'Parent village does not exist');
    return this.prisma.booth.create({
      data: {
        number: dto.number,
        name: dto.name,
        voterCount: dto.voterCount ?? 0,
        villageId: dto.villageId,
      },
    });
  }

  async updateBooth(id: string, dto: UpdateBoothDto) {
    await this.ensure('booth', id);
    if (dto.villageId) await this.ensure('village', dto.villageId, 'Parent village does not exist');
    return this.prisma.booth.update({
      where: { id },
      data: { number: dto.number, name: dto.name, voterCount: dto.voterCount, villageId: dto.villageId },
    });
  }

  async deleteBooth(id: string) {
    const node = await this.prisma.booth.findUnique({
      where: { id },
      select: { _count: { select: { citizens: true } } },
    });
    if (!node) throw new NotFoundException('Booth not found');
    this.guardDependents('booth', node._count);
    await this.prisma.booth.delete({ where: { id } });
    return { success: true };
  }

  // ===== helpers =====
  private async ensure(
    model: 'state' | 'district' | 'constituency' | 'mandal' | 'village' | 'booth',
    id: string,
    message?: string,
  ) {
    // @ts-expect-error dynamic prisma delegate access by model name
    const found = await this.prisma[model].findUnique({ where: { id }, select: { id: true } });
    if (!found) throw message ? new BadRequestException(message) : new NotFoundException(`${model} not found`);
  }

  private guardDependents(level: string, counts: Record<string, number>) {
    const blocking = Object.entries(counts).filter(([, n]) => n > 0);
    if (blocking.length > 0) {
      const detail = blocking.map(([k, n]) => `${n} ${k}`).join(', ');
      throw new BadRequestException(
        `This ${level} still has linked records (${detail}). Remove or reassign them before deleting.`,
      );
    }
  }
}
