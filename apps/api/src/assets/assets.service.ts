import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { AssetCategory } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { toCsv, fmtCsvDate, parseCsv } from '../common/utils/csv.util';
import type { AuthenticatedUser } from '../common/types';
import {
  AddAttachmentDto,
  AddMaintenanceLogDto,
  AssetQueryDto,
  CreateAssetDto,
  RoadDetailDto,
  HospitalDetailDto,
  SchoolDetailDto,
  RwsDetailDto,
  UpdateAssetDto,
} from './dto/asset.dto';

const CODE_PREFIX: Record<AssetCategory, string> = {
  Roads: 'RD',
  Taxes: 'TAX',
  ReligiousPlaces: 'REL',
  DevelopmentWorks: 'WRK',
  DealerShops: 'DLR',
  BurialGrounds: 'BUR',
  Hospitals: 'HOS',
  Schools: 'SCH',
  DwcraGroups: 'SHG',
  Tanks: 'TNK',
  RwsAssets: 'RWS',
  GreenAmbassadors: 'GRN',
  GovernmentOffices: 'OFC',
};

const listInclude = {
  village: { select: { id: true, name: true } },
  mandal: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  road: true,
  hospital: true,
  school: true,
  rws: true,
  _count: { select: { photos: true, documents: true, logs: true, grievances: true } },
} satisfies Prisma.AssetInclude;

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async list(query: AssetQueryDto) {
    const { page, limit, search, category, status, condition, mandalId, villageId, departmentId } = query;
    const where: Prisma.AssetWhereInput = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (mandalId) where.mandalId = mandalId;
    if (villageId) where.villageId = villageId;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { contractor: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        village: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, status: true } },
        road: true,
        hospital: true,
        school: true,
        rws: true,
        photos: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        logs: { orderBy: { performedAt: 'desc' } },
        grievances: {
          select: { id: true, code: true, title: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async create(dto: CreateAssetDto, user: AuthenticatedUser) {
    const code = dto.code?.trim() || (await this.nextCode(dto.category));
    const { road, hospital, school, rws, attributes, code: _ignored, ...core } = dto;

    const asset = await this.prisma.asset.create({
      data: {
        ...core,
        code,
        attributes: (attributes ?? undefined) as Prisma.InputJsonValue | undefined,
        createdById: user.id,
        ...this.detailCreate({ road, hospital, school, rws }),
      },
      include: listInclude,
    });
    return asset;
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.ensureExists(id);
    const { road, hospital, school, rws, attributes, ...core } = dto;
    return this.prisma.asset.update({
      where: { id },
      data: {
        ...core,
        ...(attributes !== undefined ? { attributes: attributes as Prisma.InputJsonValue } : {}),
        ...this.detailUpsert({ road, hospital, school, rws }),
      },
      include: listInclude,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.asset.delete({ where: { id } });
    return { success: true };
  }

  async addLog(id: string, dto: AddMaintenanceLogDto, user: AuthenticatedUser) {
    await this.ensureExists(id);
    await this.prisma.assetMaintenanceLog.create({
      data: {
        assetId: id,
        type: dto.type,
        note: dto.note,
        status: dto.status,
        cost: dto.cost,
        performedBy: dto.performedBy,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : new Date(),
        createdById: user.id,
      },
    });
    return this.get(id);
  }

  async addPhoto(id: string, dto: AddAttachmentDto, user: AuthenticatedUser) {
    await this.ensureExists(id);
    await this.prisma.assetPhoto.create({
      data: { assetId: id, url: dto.url, label: dto.label, mimeType: dto.mimeType, size: dto.size, uploadedById: user.id },
    });
    return this.get(id);
  }

  async removePhoto(id: string, photoId: string) {
    await this.prisma.assetPhoto.deleteMany({ where: { id: photoId, assetId: id } });
    return this.get(id);
  }

  async addDocument(id: string, dto: AddAttachmentDto, user: AuthenticatedUser) {
    await this.ensureExists(id);
    await this.prisma.assetDocument.create({
      data: { assetId: id, url: dto.url, label: dto.label, mimeType: dto.mimeType, size: dto.size, uploadedById: user.id },
    });
    return this.get(id);
  }

  async removeDocument(id: string, documentId: string) {
    await this.prisma.assetDocument.deleteMany({ where: { id: documentId, assetId: id } });
    return this.get(id);
  }

  async options() {
    const [departments, projects] = await Promise.all([
      this.prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      this.prisma.developmentProject.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);
    return { departments, projects };
  }

  async gisPoints(category?: AssetCategory) {
    const where: Prisma.AssetWhereInput = { latitude: { not: null }, longitude: { not: null } };
    if (category) where.category = category;
    const assets = await this.prisma.asset.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        status: true,
        condition: true,
        latitude: true,
        longitude: true,
        mandal: { select: { name: true } },
      },
      take: 2000,
    });
    return assets.map((a) => ({
      id: a.id,
      name: a.name,
      code: a.code,
      category: a.category,
      status: a.status,
      condition: a.condition,
      lat: a.latitude,
      lng: a.longitude,
      mandal: a.mandal?.name ?? null,
    }));
  }

  async stats(category?: AssetCategory) {
    if (!category) return this.overviewStats();

    const assets = await this.prisma.asset.findMany({
      where: { category },
      include: { mandal: { select: { name: true } }, road: true, hospital: true, school: true, rws: true },
    });

    const total = assets.length;
    const byStatus = this.countBy(assets, (a) => a.status);
    const byCondition = this.countBy(assets.filter((a) => a.condition), (a) => a.condition as string);
    const byMandal = this.countBy(assets.filter((a) => a.mandal), (a) => a.mandal!.name);

    const detail: Record<string, unknown> = {};
    if (category === 'Roads') {
      const totalLengthKm = assets.reduce((s, a) => s + (a.road?.lengthKm ?? 0), 0);
      const mandalLength: Record<string, number> = {};
      for (const a of assets) {
        if (a.mandal) mandalLength[a.mandal.name] = (mandalLength[a.mandal.name] ?? 0) + (a.road?.lengthKm ?? 0);
      }
      detail.totalLengthKm = Number(totalLengthKm.toFixed(2));
      detail.goodRoads = assets.filter((a) => a.condition === 'Good').length;
      detail.damagedRoads = assets.filter((a) => a.condition === 'Damaged' || a.condition === 'Critical').length;
      detail.underDevelopment = assets.filter((a) => a.status === 'UnderDevelopment').length;
      detail.mandalLengthKm = mandalLength;
    } else if (category === 'Hospitals') {
      detail.totalBeds = assets.reduce((s, a) => s + (a.hospital?.bedsCount ?? 0), 0);
      detail.totalDoctors = assets.reduce((s, a) => s + (a.hospital?.doctorsCount ?? 0), 0);
      detail.totalAmbulances = assets.reduce((s, a) => s + (a.hospital?.ambulances ?? 0), 0);
      detail.byType = this.countBy(assets.filter((a) => a.hospital?.hospitalType), (a) => a.hospital!.hospitalType as string);
    } else if (category === 'Schools') {
      const students = assets.reduce((s, a) => s + (a.school?.studentCount ?? 0), 0);
      const teachers = assets.reduce((s, a) => s + (a.school?.teacherCount ?? 0), 0);
      detail.totalStudents = students;
      detail.totalTeachers = teachers;
      detail.studentTeacherRatio = teachers > 0 ? Number((students / teachers).toFixed(1)) : 0;
      detail.midDayMealSchools = assets.filter((a) => a.school?.midDayMeal).length;
      detail.byType = this.countBy(assets.filter((a) => a.school?.schoolType), (a) => a.school!.schoolType as string);
    } else if (category === 'RwsAssets') {
      detail.functional = assets.filter((a) => a.rws?.functional).length;
      detail.nonFunctional = assets.filter((a) => a.rws && !a.rws.functional).length;
      detail.byType = this.countBy(assets.filter((a) => a.rws?.assetType), (a) => a.rws!.assetType as string);
    }

    return { category, total, byStatus, byCondition, byMandal, detail };
  }

  private async overviewStats() {
    const byCategoryGrouped = await this.prisma.asset.groupBy({ by: ['category'], _count: { _all: true } });
    const byStatusGrouped = await this.prisma.asset.groupBy({ by: ['status'], _count: { _all: true } });
    const byCategory: Record<string, number> = {};
    for (const g of byCategoryGrouped) byCategory[g.category] = g._count._all;
    const byStatus: Record<string, number> = {};
    for (const g of byStatusGrouped) byStatus[g.status] = g._count._all;
    const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
    const underMaintenance = byStatus.UnderMaintenance ?? 0;
    const underDevelopment = byStatus.UnderDevelopment ?? 0;
    return { total, byCategory, byStatus, underMaintenance, underDevelopment };
  }

  async exportCsv(category?: AssetCategory) {
    const where: Prisma.AssetWhereInput = {};
    if (category) where.category = category;
    const rows = await this.prisma.asset.findMany({
      where,
      include: { mandal: { select: { name: true } }, village: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const csv = toCsv(rows, [
      { header: 'Code', value: (r) => r.code },
      { header: 'Name', value: (r) => r.name },
      { header: 'Category', value: (r) => r.category },
      { header: 'Status', value: (r) => r.status },
      { header: 'Condition', value: (r) => r.condition ?? '' },
      { header: 'Mandal', value: (r) => r.mandal?.name ?? '' },
      { header: 'Village', value: (r) => r.village?.name ?? '' },
      { header: 'Ward', value: (r) => r.wardNumber ?? '' },
      { header: 'Contractor', value: (r) => r.contractor ?? '' },
      { header: 'Address', value: (r) => r.address ?? '' },
      { header: 'Latitude', value: (r) => r.latitude ?? '' },
      { header: 'Longitude', value: (r) => r.longitude ?? '' },
      { header: 'Created', value: (r) => fmtCsvDate(r.createdAt) },
    ]);
    const filename = `assets-${category ?? 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
    return { filename, csv };
  }

  async importCsv(csv: string, fallbackCategory?: AssetCategory, user?: AuthenticatedUser) {
    const records = parseCsv(csv);
    let created = 0;
    const errors: string[] = [];
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const category = (r.Category || r.category || fallbackCategory) as AssetCategory | undefined;
      const name = r.Name || r.name;
      if (!category || !CODE_PREFIX[category]) {
        errors.push(`Row ${i + 2}: missing or invalid Category`);
        continue;
      }
      if (!name) {
        errors.push(`Row ${i + 2}: missing Name`);
        continue;
      }
      const mandalName = r.Mandal || r.mandal;
      const mandal = mandalName
        ? await this.prisma.mandal.findFirst({ where: { name: { equals: mandalName, mode: 'insensitive' } }, select: { id: true, constituencyId: true } })
        : null;
      await this.prisma.asset.create({
        data: {
          category,
          name,
          code: (r.Code || r.code || '').trim() || (await this.nextCode(category)),
          status: (r.Status || r.status || 'Active') as never,
          condition: (r.Condition || r.condition || undefined) as never,
          contractor: r.Contractor || r.contractor || undefined,
          address: r.Address || r.address || undefined,
          wardNumber: r.Ward || r.ward || undefined,
          latitude: r.Latitude ? Number(r.Latitude) : undefined,
          longitude: r.Longitude ? Number(r.Longitude) : undefined,
          mandalId: mandal?.id,
          constituencyId: mandal?.constituencyId,
          createdById: user?.id,
        },
      });
      created++;
    }
    return { created, failed: errors.length, errors: errors.slice(0, 20) };
  }

  // ---- helpers ----

  private detailCreate(d: {
    road?: RoadDetailDto;
    hospital?: HospitalDetailDto;
    school?: SchoolDetailDto;
    rws?: RwsDetailDto;
  }) {
    const out: Prisma.AssetCreateInput | Record<string, unknown> = {};
    if (d.road) out.road = { create: this.normalizeRoad(d.road) };
    if (d.hospital) out.hospital = { create: d.hospital };
    if (d.school) out.school = { create: d.school };
    if (d.rws) out.rws = { create: d.rws };
    return out;
  }

  private detailUpsert(d: {
    road?: RoadDetailDto;
    hospital?: HospitalDetailDto;
    school?: SchoolDetailDto;
    rws?: RwsDetailDto;
  }) {
    const out: Record<string, unknown> = {};
    if (d.road) {
      const data = this.normalizeRoad(d.road);
      out.road = { upsert: { create: data, update: data } };
    }
    if (d.hospital) out.hospital = { upsert: { create: d.hospital, update: d.hospital } };
    if (d.school) out.school = { upsert: { create: d.school, update: d.school } };
    if (d.rws) out.rws = { upsert: { create: d.rws, update: d.rws } };
    return out;
  }

  private normalizeRoad(road: RoadDetailDto) {
    return {
      roadType: road.roadType,
      lengthKm: road.lengthKm,
      widthM: road.widthM,
      lastRepairDate: road.lastRepairDate ? new Date(road.lastRepairDate) : undefined,
    };
  }

  private countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const item of items) {
      const k = key(item);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }

  private async nextCode(category: AssetCategory) {
    const prefix = CODE_PREFIX[category];
    const existing = await this.prisma.asset.findMany({
      where: { code: { startsWith: `${prefix}-` } },
      select: { code: true },
    });
    let max = 0;
    for (const { code } of existing) {
      const num = parseInt(code.replace(/\D/g, ''), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }
    return `${prefix}-${String(max + 1).padStart(4, '0')}`;
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.asset.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Asset not found');
  }
}
