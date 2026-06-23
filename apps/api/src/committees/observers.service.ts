import { Injectable } from '@nestjs/common';
import { NetworkEntityType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { CsvColumn, fmtCsvDate } from '../common/utils/csv.util';
import { NetworkBaseService, PrismaDelegate } from './network-base.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable()
export class ObserversService extends NetworkBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.observer as unknown as PrismaDelegate;
  }
  protected get entityType(): NetworkEntityType {
    return NetworkEntityType.Observer;
  }
  protected get label(): string {
    return 'Observer';
  }

  csvColumns(): CsvColumn<any>[] {
    return [
      ...this.commonCsvColumns(),
      { header: 'Observation Area', value: (r) => r.observationArea },
      { header: 'Assigned Mandals', value: (r) => r.assignedMandals },
      { header: 'Reporting Frequency', value: (r) => r.reportingFrequency },
      { header: 'Performance Remarks', value: (r) => r.performanceRemarks },
      { header: 'Issue Escalation Count', value: (r) => r.issueEscalationCount },
      { header: 'Created At', value: (r) => fmtCsvDate(r.createdAt) },
    ];
  }

  mapImportRow(row: Record<string, string>): Record<string, unknown> | null {
    const common = this.mapCommonImport(row);
    if (!common) return null;
    const count = Number(row['Issue Escalation Count']);
    return {
      ...common,
      observationArea: row['Observation Area'] || null,
      assignedMandals: row['Assigned Mandals'] || null,
      reportingFrequency: row['Reporting Frequency'] || null,
      performanceRemarks: row['Performance Remarks'] || null,
      issueEscalationCount: Number.isFinite(count) && count >= 0 ? count : 0,
    };
  }
}
