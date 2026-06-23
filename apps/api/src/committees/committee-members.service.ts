import { Injectable } from '@nestjs/common';
import { NetworkEntityType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { CsvColumn, fmtCsvDate } from '../common/utils/csv.util';
import { NetworkBaseService, PrismaDelegate } from './network-base.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable()
export class CommitteeMembersService extends NetworkBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.committeeMember as unknown as PrismaDelegate;
  }
  protected get entityType(): NetworkEntityType {
    return NetworkEntityType.CommitteeMember;
  }
  protected get label(): string {
    return 'Committee member';
  }

  protected include = {
    mandal: { select: { id: true, name: true } },
    village: { select: { id: true, name: true } },
    booth: { select: { id: true, number: true, name: true } },
    reportingPerson: { select: { id: true, name: true, designation: true } },
    committee: { select: { id: true, name: true, category: true } },
  };

  csvColumns(): CsvColumn<any>[] {
    return [
      ...this.commonCsvColumns(),
      { header: 'Committee', value: (r) => r.committeeName ?? r.committee?.name },
      { header: 'Category', value: (r) => r.category },
      { header: 'Committee Role', value: (r) => r.committeeRole },
      { header: 'Party Position', value: (r) => r.partyPosition },
      { header: 'Joining Date', value: (r) => fmtCsvDate(r.joiningDate) },
      { header: 'Attendance Count', value: (r) => r.attendanceCount },
      { header: 'Task Completion Score', value: (r) => r.taskCompletionScore },
      { header: 'Volunteer Strength', value: (r) => r.volunteerStrength },
      { header: 'Booth Responsibility', value: (r) => r.boothResponsibility },
      { header: 'Created At', value: (r) => fmtCsvDate(r.createdAt) },
    ];
  }

  mapImportRow(row: Record<string, string>): Record<string, unknown> | null {
    const common = this.mapCommonImport(row);
    if (!common) return null;
    const category = pickCategory(row['Category'] || row['category']);
    const num = (v: string | undefined) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    return {
      ...common,
      category,
      committeeName: row['Committee'] || row['committeeName'] || null,
      committeeRole: row['Committee Role'] || null,
      partyPosition: row['Party Position'] || null,
      attendanceCount: num(row['Attendance Count']) ?? 0,
      taskCompletionScore: num(row['Task Completion Score']) ?? 0,
      volunteerStrength: num(row['Volunteer Strength']) ?? 0,
      boothResponsibility: row['Booth Responsibility'] || null,
    };
  }
}

function pickCategory(value: string | undefined): string {
  const allowed = [
    'MandalCommittee',
    'VillageCommittee',
    'CoordinationCommittee',
    'MandalCoordinationCommittee',
  ];
  if (!value) return 'MandalCommittee';
  const normalized = value.replace(/\s+/g, '').toLowerCase();
  return allowed.find((a) => a.toLowerCase() === normalized) ?? 'MandalCommittee';
}
