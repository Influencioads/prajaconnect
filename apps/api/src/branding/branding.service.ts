import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BRANDING_DEFAULTS: Record<string, string> = {
  app_name: 'Praja Connect CRM',
  party: '',
  party_full_name: '',
  primary_color: '#003366',
  secondary_color: '#FFD600',
  accent_color: '#FFD600',
  logo_url: '',
};

@Injectable()
export class BrandingService {
  constructor(private prisma: PrismaService) {}

  async getBranding() {
    const keys = Object.keys(BRANDING_DEFAULTS);
    const rows = await this.prisma.setting.findMany({ where: { key: { in: keys } } });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const value = (key: string) => map.get(key) ?? BRANDING_DEFAULTS[key];

    return {
      appName: value('app_name'),
      party: value('party'),
      partyFullName: value('party_full_name'),
      primaryColor: value('primary_color'),
      secondaryColor: value('secondary_color'),
      accentColor: value('accent_color'),
      logoUrl: value('logo_url'),
    };
  }
}
