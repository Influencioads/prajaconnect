import { Injectable } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private scope(user: AuthenticatedUser): Prisma.NotificationWhereInput {
    return {
      OR: [
        { userId: user.id },
        { audienceRole: user.role as Prisma.NotificationWhereInput['audienceRole'] },
        { userId: null, audienceRole: null },
      ],
    };
  }

  async list(user: AuthenticatedUser) {
    return this.prisma.notification.findMany({
      where: this.scope(user),
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(user: AuthenticatedUser) {
    const count = await this.prisma.notification.count({
      where: { AND: [this.scope(user), { read: false }] },
    });
    return { count };
  }

  async markRead(user: AuthenticatedUser, id: string) {
    await this.prisma.notification.updateMany({
      where: { AND: [this.scope(user), { id }] },
      data: { read: true },
    });
    return { success: true };
  }

  async markAllRead(user: AuthenticatedUser) {
    await this.prisma.notification.updateMany({
      where: { AND: [this.scope(user), { read: false }] },
      data: { read: true },
    });
    return { success: true };
  }
}
