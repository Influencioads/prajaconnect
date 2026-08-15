import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export type WhatsappSendResult = { simulated?: boolean; sent?: boolean; status?: number };

@Injectable()
export class WhatsappAdapter {
  private readonly logger = new Logger(WhatsappAdapter.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async setting(key: string): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row?.value) return row.value;
    return this.config.get<string>(key, '') ?? '';
  }

  private async credentials() {
    const [token, phoneId] = await Promise.all([
      this.setting('WHATSAPP_ACCESS_TOKEN'),
      this.setting('WHATSAPP_PHONE_NUMBER_ID'),
    ]);
    return { token, phoneId };
  }

  async isConfigured(): Promise<boolean> {
    const { token, phoneId } = await this.credentials();
    return Boolean(token && phoneId);
  }

  async sendText(to: string, body: string): Promise<WhatsappSendResult> {
    return this.send(to, { type: 'text', text: { body } });
  }

  async sendDocument(to: string, link: string, caption?: string): Promise<WhatsappSendResult> {
    return this.send(to, { type: 'document', document: { link, caption } });
  }

  private async send(to: string, payload: Record<string, unknown>): Promise<WhatsappSendResult> {
    const { token, phoneId } = await this.credentials();
    if (!token || !phoneId) {
      this.logger.log('[dispatch] whatsapp simulated (not configured)');
      return { simulated: true };
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, ...payload }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(`WhatsApp send failed (${res.status}): ${text.slice(0, 200)}`);
        return { sent: false, status: res.status };
      }
      return { sent: true, status: res.status };
    } catch (err) {
      this.logger.error('WhatsApp send request failed', err as Error);
      return { sent: false };
    }
  }
}
