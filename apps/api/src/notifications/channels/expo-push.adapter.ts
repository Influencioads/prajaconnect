import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../../prisma/prisma.service';

export type PushSendResult = { simulated?: boolean; sent?: number };

@Injectable()
export class ExpoPushAdapter {
  private readonly logger = new Logger(ExpoPushAdapter.name);
  private readonly expo = new Expo();

  constructor(private prisma: PrismaService) {}

  async send(input: {
    userIds?: string[];
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }): Promise<PushSendResult> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: input.userIds ? { userId: { in: input.userIds } } : undefined,
      select: { token: true },
    });
    const valid = tokens.map((t) => t.token).filter((t) => Expo.isExpoPushToken(t));
    if (!valid.length) {
      this.logger.log('[dispatch] push simulated (not configured)');
      return { simulated: true };
    }

    const messages: ExpoPushMessage[] = valid.map((to) => ({
      to,
      title: input.title,
      body: input.body,
      data: input.data,
    }));

    let sent = 0;
    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        sent += tickets.filter((t) => t.status === 'ok').length;
      } catch (err) {
        this.logger.error('Expo push send failed', err as Error);
      }
    }
    return { sent };
  }
}
