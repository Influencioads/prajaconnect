import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export type SmsSendResult = { simulated?: boolean; sent?: boolean; status?: number };

@Injectable()
export class SmsAdapter {
  private readonly logger = new Logger(SmsAdapter.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async setting(key: string): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row?.value) return row.value;
    return this.config.get<string>(key, '') ?? '';
  }

  async send(mobile: string, message: string): Promise<SmsSendResult> {
    const [urlTemplate, auth] = await Promise.all([
      this.setting('SMS_GATEWAY_URL'),
      this.setting('SMS_GATEWAY_AUTH'),
    ]);
    if (!urlTemplate) {
      this.logger.log('[dispatch] sms simulated (not configured)');
      return { simulated: true };
    }
    const url = urlTemplate
      .replace('{mobile}', encodeURIComponent(mobile))
      .replace('{message}', encodeURIComponent(message));
    try {
      const res = await fetch(url, {
        headers: auth ? { Authorization: auth } : undefined,
      });
      if (!res.ok) {
        this.logger.error(`SMS gateway responded ${res.status}`);
        return { sent: false, status: res.status };
      }
      return { sent: true, status: res.status };
    } catch (err) {
      this.logger.error('SMS gateway request failed', err as Error);
      return { sent: false };
    }
  }
}
