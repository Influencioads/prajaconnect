import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrConfigService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async setting(key: string, envFallback?: string): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row?.value) return row.value;
    return envFallback ?? '';
  }

  async isCronEnabled(): Promise<boolean> {
    const val = await this.setting('pr_cron_enabled', this.config.get('PR_CRON_ENABLED', 'true'));
    return val.toLowerCase() !== 'false';
  }

  async responseSlaHours(): Promise<number> {
    const val = await this.setting('pr_response_sla_hours', this.config.get('PR_RESPONSE_SLA_HOURS', '24'));
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : 24;
  }

  async leaderNames(): Promise<string[]> {
    const val = await this.setting(
      'pr_leader_names',
      'Chandrababu Naidu,Nara Lokesh',
    );
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async partyKeywords(): Promise<string[]> {
    const val = await this.setting(
      'pr_party_keywords',
      'TDP,Telugu Desam Party,Andhra Pradesh,Mangalagiri',
    );
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }

  openAiApiKey(): string {
    return this.config.get<string>('OPENAI_API_KEY', '') ?? '';
  }

  openAiModel(): string {
    return this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini') ?? 'gpt-4o-mini';
  }
}
