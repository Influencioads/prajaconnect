import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_GREETING =
  'Namaste! I am the citizen assistant. I can register a grievance, check a grievance status, or tell you about welfare schemes. How can I help you today?';

@Injectable()
export class WhatsappBotConfigService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async setting(key: string, envFallback?: string): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row?.value) return row.value;
    return envFallback ?? '';
  }

  async isBotEnabled(): Promise<boolean> {
    const val = await this.setting('whatsapp_bot_enabled', this.config.get('WHATSAPP_BOT_ENABLED', 'true'));
    return val.toLowerCase() !== 'false';
  }

  async greeting(): Promise<string> {
    const val = await this.setting('whatsapp_bot_greeting');
    return val || DEFAULT_GREETING;
  }

  async verifyToken(): Promise<string> {
    return this.setting('WHATSAPP_VERIFY_TOKEN', this.config.get('WHATSAPP_VERIFY_TOKEN', ''));
  }

  async getConfig() {
    const [enabled, greeting] = await Promise.all([this.isBotEnabled(), this.greeting()]);
    return { enabled, greeting };
  }

  async updateConfig(dto: { enabled?: boolean; greeting?: string }) {
    const writes: { key: string; value: string }[] = [];
    if (dto.enabled !== undefined) writes.push({ key: 'whatsapp_bot_enabled', value: String(dto.enabled) });
    if (dto.greeting !== undefined) writes.push({ key: 'whatsapp_bot_greeting', value: dto.greeting });
    for (const { key, value } of writes) {
      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value, category: 'whatsapp' },
        update: { value },
      });
    }
    return this.getConfig();
  }
}
