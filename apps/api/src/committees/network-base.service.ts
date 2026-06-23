import { NotFoundException } from '@nestjs/common';
import { NetworkEntityType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import { CsvColumn, parseCsv, toCsv } from '../common/utils/csv.util';
import { AddActivityDto } from './dto/network.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PrismaDelegate {
  findMany(args?: any): Promise<any[]>;
  findUnique(args: any): Promise<any | null>;
  count(args?: any): Promise<number>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
}

export const NETWORK_GEO_INCLUDE = {
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  reportingPerson: { select: { id: true, name: true, designation: true } },
};

/**
 * Generic CRUD + search + CSV + activity service for the member-type
 * network entities (committee members, observers, IMP leaders, influencers, press).
 */
export abstract class NetworkBaseService<T = any> {
  constructor(protected readonly prisma: PrismaService) {}

  protected abstract get delegate(): PrismaDelegate;
  protected abstract get entityType(): NetworkEntityType;
  protected abstract get label(): string;
  /** String fields used for the free-text search. */
  protected searchFields: string[] = ['fullName', 'mobile', 'email', 'designation'];
  protected include: Record<string, unknown> = NETWORK_GEO_INCLUDE;
  protected abstract csvColumns(): CsvColumn<T>[];
  /** Map a raw CSV row into Prisma create data. */
  protected abstract mapImportRow(row: Record<string, string>): Record<string, unknown> | null;

  protected buildWhere(query: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.mandalId) where.mandalId = query.mandalId;
    if (query.villageId) where.villageId = query.villageId;
    if (query.boothId) where.boothId = query.boothId;
    if (query.category) where.category = query.category;
    if (query.committeeId) where.committeeId = query.committeeId;
    if (query.journalistType) where.journalistType = query.journalistType;
    if (query.search) {
      where.OR = this.searchFields.map((f) => ({
        [f]: { contains: query.search, mode: 'insensitive' },
      }));
    }
    return where;
  }

  async list(query: Record<string, any>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where = this.buildWhere(query);
    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where,
        include: this.include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.delegate.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async stats(query: Record<string, any> = {}) {
    const base = this.buildWhere(query);
    const [total, active, inactive] = await Promise.all([
      this.delegate.count({ where: base }),
      this.delegate.count({ where: { ...base, status: 'Active' } }),
      this.delegate.count({ where: { ...base, status: 'Inactive' } }),
    ]);
    return { total, active, inactive };
  }

  async get(id: string) {
    const entity = await this.delegate.findUnique({ where: { id }, include: this.include });
    if (!entity) throw new NotFoundException(`${this.label} not found`);
    const activity = await this.prisma.committeeActivityLog.findMany({
      where: { entityType: this.entityType, entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { ...entity, activity };
  }

  async create(dto: Record<string, unknown>, userId?: string) {
    const entity = await this.delegate.create({
      data: { ...dto, createdById: userId ?? (dto.createdById as string) ?? null },
      include: this.include,
    });
    await this.logActivity(entity.id, 'Created', `${this.label} added`, userId);
    return entity;
  }

  async update(id: string, dto: Record<string, unknown>, userId?: string) {
    await this.ensureExists(id);
    const entity = await this.delegate.update({ where: { id }, data: { ...dto }, include: this.include });
    await this.logActivity(id, 'Updated', `${this.label} details updated`, userId);
    return entity;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.committeeActivityLog.deleteMany({
      where: { entityType: this.entityType, entityId: id },
    });
    await this.delegate.delete({ where: { id } });
    return { success: true };
  }

  async addActivity(id: string, dto: AddActivityDto, userId?: string) {
    await this.ensureExists(id);
    return this.prisma.committeeActivityLog.create({
      data: {
        entityType: this.entityType,
        entityId: id,
        action: dto.action,
        note: dto.note ?? null,
        byUserId: userId ?? null,
        byName: dto.byName ?? null,
        eventId: dto.eventId ?? null,
        grievanceId: dto.grievanceId ?? null,
      },
    });
  }

  async exportCsv(query: Record<string, any> = {}): Promise<{ filename: string; csv: string; rows: number }> {
    const where = this.buildWhere(query);
    const rows = await this.delegate.findMany({ where, include: this.include, orderBy: { createdAt: 'desc' } });
    const csv = toCsv(rows as T[], this.csvColumns());
    const stamp = new Date().toISOString().slice(0, 10);
    return { filename: `${this.entityType.toLowerCase()}-${stamp}.csv`, csv, rows: rows.length };
  }

  async importCsv(csv: string, userId?: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const records = parseCsv(csv);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (let i = 0; i < records.length; i++) {
      const data = this.mapImportRow(records[i]);
      if (!data) {
        skipped++;
        continue;
      }
      try {
        const entity = await this.delegate.create({ data: { ...data, createdById: userId ?? null } });
        await this.logActivity(entity.id, 'Imported', `${this.label} imported from CSV`, userId);
        imported++;
      } catch (e) {
        skipped++;
        errors.push(`Row ${i + 2}: ${(e as Error).message}`);
      }
    }
    return { imported, skipped, errors: errors.slice(0, 20) };
  }

  protected async logActivity(entityId: string, action: string, note: string, userId?: string) {
    await this.prisma.committeeActivityLog.create({
      data: {
        entityType: this.entityType,
        entityId,
        action,
        note,
        byUserId: userId ?? null,
      },
    });
  }

  protected async ensureExists(id: string) {
    const found = await this.delegate.findUnique({ where: { id }, select: { id: true } } as any);
    if (!found) throw new NotFoundException(`${this.label} not found`);
  }

  // ---- shared CSV helpers for common fields ----
  protected commonCsvColumns(): CsvColumn<any>[] {
    return [
      { header: 'Full Name', value: (r) => r.fullName },
      { header: 'Mobile', value: (r) => r.mobile },
      { header: 'WhatsApp', value: (r) => r.whatsapp },
      { header: 'Email', value: (r) => r.email },
      { header: 'Gender', value: (r) => r.gender },
      { header: 'Age', value: (r) => r.age },
      { header: 'Designation', value: (r) => r.designation },
      { header: 'Category Type', value: (r) => r.categoryType },
      { header: 'Mandal', value: (r) => r.mandal?.name },
      { header: 'Village', value: (r) => r.village?.name },
      { header: 'Ward Number', value: (r) => r.wardNumber },
      { header: 'Booth Number', value: (r) => r.boothNumber },
      { header: 'Address', value: (r) => r.address },
      { header: 'Political Influence Level', value: (r) => r.politicalInfluenceLevel },
      { header: 'Public Reach', value: (r) => r.publicReach },
      { header: 'Assigned Area', value: (r) => r.assignedArea },
      { header: 'Reporting Person', value: (r) => r.reportingPerson?.name },
      { header: 'Status', value: (r) => r.status },
      { header: 'Notes', value: (r) => r.notes },
    ];
  }

  protected mapCommonImport(row: Record<string, string>): Record<string, unknown> | null {
    const fullName = row['Full Name'] || row['fullName'] || row['Name'];
    const mobile = row['Mobile'] || row['mobile'] || row['Mobile Number'];
    if (!fullName || !mobile) return null;
    const status = (row['Status'] || row['status'] || 'Active').trim();
    const age = Number(row['Age'] || row['age']);
    const publicReach = Number(row['Public Reach'] || row['publicReach']);
    return {
      fullName,
      mobile,
      whatsapp: row['WhatsApp'] || row['whatsapp'] || null,
      email: row['Email'] || row['email'] || null,
      gender: pickEnum(row['Gender'] || row['gender'], ['Male', 'Female', 'Other']),
      age: Number.isFinite(age) && age > 0 ? age : null,
      designation: row['Designation'] || row['designation'] || null,
      categoryType: row['Category Type'] || row['categoryType'] || null,
      wardNumber: row['Ward Number'] || row['wardNumber'] || null,
      boothNumber: row['Booth Number'] || row['boothNumber'] || null,
      address: row['Address'] || row['address'] || null,
      politicalInfluenceLevel: row['Political Influence Level'] || null,
      publicReach: Number.isFinite(publicReach) && publicReach > 0 ? publicReach : null,
      assignedArea: row['Assigned Area'] || row['assignedArea'] || null,
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      notes: row['Notes'] || row['notes'] || null,
    };
  }
}

function pickEnum(value: string | undefined, allowed: string[]): string | null {
  if (!value) return null;
  const match = allowed.find((a) => a.toLowerCase() === value.trim().toLowerCase());
  return match ?? null;
}
