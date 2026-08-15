import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

export type EmailSendResult = { simulated?: boolean; sent?: boolean };
export type EmailAttachment = string | { filename: string; content: Buffer };

@Injectable()
export class EmailAdapter {
  private readonly logger = new Logger(EmailAdapter.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async setting(key: string): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row?.value) return row.value;
    return this.config.get<string>(key, '') ?? '';
  }

  async send(to: string, subject: string, body: string, attachment?: EmailAttachment): Promise<EmailSendResult> {
    const [host, port, user, pass, from] = await Promise.all([
      this.setting('SMTP_HOST'),
      this.setting('SMTP_PORT'),
      this.setting('SMTP_USER'),
      this.setting('SMTP_PASS'),
      this.setting('SMTP_FROM'),
    ]);
    if (!host) {
      this.logger.log('[dispatch] email simulated (not configured)');
      return { simulated: true };
    }
    const portNum = parseInt(port, 10) || 587;
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: portNum === 465,
      auth: user ? { user, pass } : undefined,
    });
    const attachments =
      typeof attachment === 'string' ? [{ path: attachment }] : attachment ? [attachment] : undefined;
    try {
      await transporter.sendMail({ from: from || user, to, subject, text: body, attachments });
      return { sent: true };
    } catch (err) {
      this.logger.error('SMTP send failed', err as Error);
      return { sent: false };
    }
  }
}
