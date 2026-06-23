import { Injectable } from '@nestjs/common';
import { NetworkEntityType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { CsvColumn, fmtCsvDate } from '../common/utils/csv.util';
import { NetworkBaseService, PrismaDelegate } from './network-base.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable()
export class InfluencersService extends NetworkBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.influencer as unknown as PrismaDelegate;
  }
  protected get entityType(): NetworkEntityType {
    return NetworkEntityType.Influencer;
  }
  protected get label(): string {
    return 'Influencer';
  }

  protected searchFields = ['fullName', 'mobile', 'email', 'platform', 'contentCategory'];

  csvColumns(): CsvColumn<any>[] {
    return [
      ...this.commonCsvColumns(),
      { header: 'Platform', value: (r) => r.platform },
      { header: 'Instagram Followers', value: (r) => r.instagramFollowers },
      { header: 'Facebook Followers', value: (r) => r.facebookFollowers },
      { header: 'YouTube Subscribers', value: (r) => r.youtubeSubscribers },
      { header: 'X/Twitter Followers', value: (r) => r.twitterFollowers },
      { header: 'Engagement Rate', value: (r) => r.engagementRate },
      { header: 'Content Category', value: (r) => r.contentCategory },
      { header: 'Political Alignment', value: (r) => r.politicalAlignment },
      { header: 'Collaboration Status', value: (r) => r.collaborationStatus },
      { header: 'Created At', value: (r) => fmtCsvDate(r.createdAt) },
    ];
  }

  mapImportRow(row: Record<string, string>): Record<string, unknown> | null {
    const common = this.mapCommonImport(row);
    if (!common) return null;
    const intOf = (v: string | undefined) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    };
    const floatOf = (v: string | undefined) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    return {
      ...common,
      platform: row['Platform'] || null,
      instagramFollowers: intOf(row['Instagram Followers']),
      facebookFollowers: intOf(row['Facebook Followers']),
      youtubeSubscribers: intOf(row['YouTube Subscribers']),
      twitterFollowers: intOf(row['X/Twitter Followers'] || row['Twitter Followers']),
      engagementRate: floatOf(row['Engagement Rate']),
      contentCategory: row['Content Category'] || null,
      politicalAlignment: row['Political Alignment'] || null,
      collaborationStatus: row['Collaboration Status'] || null,
    };
  }
}
