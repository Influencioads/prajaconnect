import { Injectable } from '@nestjs/common';
import { NetworkEntityType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { CsvColumn, fmtCsvDate } from '../common/utils/csv.util';
import { NetworkBaseService, PrismaDelegate } from './network-base.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable()
export class ImpLeadersService extends NetworkBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.impLeader as unknown as PrismaDelegate;
  }
  protected get entityType(): NetworkEntityType {
    return NetworkEntityType.ImpLeader;
  }
  protected get label(): string {
    return 'IMP leader';
  }

  csvColumns(): CsvColumn<any>[] {
    return [
      ...this.commonCsvColumns(),
      { header: 'Influence Area', value: (r) => r.influenceArea },
      { header: 'Community Reach', value: (r) => r.communityReach },
      { header: 'Voter Influence Score', value: (r) => r.voterInfluenceScore },
      { header: 'Key Support Groups', value: (r) => r.keySupportGroups },
      { header: 'Priority Level', value: (r) => r.priorityLevel },
      { header: 'Created At', value: (r) => fmtCsvDate(r.createdAt) },
    ];
  }

  mapImportRow(row: Record<string, string>): Record<string, unknown> | null {
    const common = this.mapCommonImport(row);
    if (!common) return null;
    const reach = Number(row['Community Reach']);
    const score = Number(row['Voter Influence Score']);
    return {
      ...common,
      influenceArea: row['Influence Area'] || null,
      communityReach: Number.isFinite(reach) && reach >= 0 ? reach : null,
      voterInfluenceScore: Number.isFinite(score) && score >= 0 ? score : null,
      keySupportGroups: row['Key Support Groups'] || null,
      priorityLevel: row['Priority Level'] || null,
    };
  }
}
