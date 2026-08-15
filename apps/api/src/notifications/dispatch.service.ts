import { Injectable } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { ExpoPushAdapter } from './channels/expo-push.adapter';
import { WhatsappAdapter } from './channels/whatsapp.adapter';
import { SmsAdapter } from './channels/sms.adapter';
import { EmailAdapter } from './channels/email.adapter';

export type DispatchChannel = 'inapp' | 'push' | 'whatsapp' | 'sms' | 'email';

export interface DispatchInput {
  userId?: string;
  userIds?: string[];
  audienceRole?: string;
  broadcast?: boolean;
  title: string;
  body?: string;
  link?: string;
  type?: string;
  data?: Record<string, unknown>;
  channels?: DispatchChannel[];
  whatsappTo?: string;
  smsTo?: string;
  emailTo?: string;
  attachmentUrl?: string;
}

@Injectable()
export class NotificationDispatchService {
  constructor(
    private prisma: PrismaService,
    private push: ExpoPushAdapter,
    private whatsapp: WhatsappAdapter,
    private sms: SmsAdapter,
    private email: EmailAdapter,
  ) {}

  async dispatch(input: DispatchInput) {
    const base = {
      type: input.type as Prisma.NotificationUncheckedCreateInput['type'],
      title: input.title,
      body: input.body,
      link: input.link,
    };

    let inapp = 0;
    if (input.userIds?.length) {
      const result = await this.prisma.notification.createMany({
        data: input.userIds.map((userId) => ({ userId, ...base })),
      });
      inapp = result.count;
    } else {
      await this.prisma.notification.create({
        data: {
          userId: input.broadcast ? null : input.userId ?? null,
          audienceRole: input.broadcast
            ? null
            : (input.audienceRole as Prisma.NotificationUncheckedCreateInput['audienceRole']) ?? null,
          ...base,
        },
      });
      inapp = 1;
    }

    const results: Record<string, unknown> = { inapp };
    const channels = (input.channels ?? []).filter((c) => c !== 'inapp');
    const text = [input.title, input.body].filter(Boolean).join('\n');

    for (const channel of channels) {
      if (channel === 'push') {
        const userIds = input.broadcast
          ? undefined
          : input.userIds ?? (input.userId ? [input.userId] : []);
        results.push =
          userIds && !userIds.length
            ? { skipped: 'no recipient' }
            : await this.push.send({ userIds, title: input.title, body: input.body, data: input.data });
      } else if (channel === 'whatsapp') {
        if (!input.whatsappTo) {
          results.whatsapp = { skipped: 'whatsappTo missing' };
        } else if (input.attachmentUrl) {
          results.whatsapp = await this.whatsapp.sendDocument(input.whatsappTo, input.attachmentUrl, text);
        } else {
          results.whatsapp = await this.whatsapp.sendText(input.whatsappTo, text);
        }
      } else if (channel === 'sms') {
        results.sms = input.smsTo
          ? await this.sms.send(input.smsTo, text)
          : { skipped: 'smsTo missing' };
      } else if (channel === 'email') {
        results.email = input.emailTo
          ? await this.email.send(input.emailTo, input.title, input.body ?? '', input.attachmentUrl)
          : { skipped: 'emailTo missing' };
      }
    }

    return results;
  }
}
