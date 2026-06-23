import { Injectable } from '@nestjs/common';
import { NetworkEntityType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { CsvColumn, fmtCsvDate } from '../common/utils/csv.util';
import { NetworkBaseService, PrismaDelegate } from './network-base.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable()
export class PressService extends NetworkBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.pressContact as unknown as PrismaDelegate;
  }
  protected get entityType(): NetworkEntityType {
    return NetworkEntityType.Press;
  }
  protected get label(): string {
    return 'Press contact';
  }

  protected searchFields = ['fullName', 'mobile', 'email', 'mediaHouseName', 'beat'];

  csvColumns(): CsvColumn<any>[] {
    return [
      ...this.commonCsvColumns(),
      { header: 'Media House Name', value: (r) => r.mediaHouseName },
      { header: 'Journalist Type', value: (r) => r.journalistType },
      { header: 'Beat', value: (r) => r.beat },
      { header: 'District Coverage', value: (r) => r.districtCoverage },
      { header: 'Mandal Coverage', value: (r) => r.mandalCoverage },
      { header: 'Press ID', value: (r) => r.pressId },
      { header: 'Relationship Status', value: (r) => r.relationshipStatus },
      { header: 'Last Interaction Date', value: (r) => fmtCsvDate(r.lastInteractionDate) },
      { header: 'Created At', value: (r) => fmtCsvDate(r.createdAt) },
    ];
  }

  mapImportRow(row: Record<string, string>): Record<string, unknown> | null {
    const common = this.mapCommonImport(row);
    if (!common) return null;
    const jt = pickJournalist(row['Journalist Type'] || row['journalistType']);
    return {
      ...common,
      mediaHouseName: row['Media House Name'] || null,
      journalistType: jt,
      beat: row['Beat'] || null,
      districtCoverage: row['District Coverage'] || null,
      mandalCoverage: row['Mandal Coverage'] || null,
      pressId: row['Press ID'] || null,
      relationshipStatus: row['Relationship Status'] || null,
    };
  }
}

function pickJournalist(value: string | undefined): string | null {
  if (!value) return null;
  const allowed = ['Print', 'TV', 'Digital', 'YouTube'];
  return allowed.find((a) => a.toLowerCase() === value.trim().toLowerCase()) ?? null;
}
