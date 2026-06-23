import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ElectionCommonService {
  constructor(private prisma: PrismaService) {}

  async resolveElectionId(electionId?: string) {
    if (electionId) {
      const found = await this.prisma.election.findUnique({ where: { id: electionId }, select: { id: true } });
      if (!found) throw new NotFoundException('Election not found');
      return found.id;
    }
    const active = await this.prisma.election.findFirst({
      where: { status: 'Active' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (active) return active.id;
    const latest = await this.prisma.election.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } });
    if (!latest) throw new NotFoundException('No election configured. Create one in Election Settings.');
    return latest.id;
  }

  async notify(userId: string | null | undefined, type: NotificationType, title: string, body?: string, link?: string) {
    if (!userId) return;
    await this.prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  }

  async notifyExpenseCreator(expenseId: string, title: string, body: string, link?: string) {
    const expense = await this.prisma.electionExpense.findUnique({
      where: { id: expenseId },
      select: { createdById: true },
    });
    await this.notify(expense?.createdById, NotificationType.Info, title, body, link);
  }

  async notifyCadreUser(cadreId: string | null | undefined, type: NotificationType, title: string, body?: string, link?: string) {
    if (!cadreId) return;
    const cadre = await this.prisma.cadre.findUnique({ where: { id: cadreId }, select: { userId: true } });
    await this.notify(cadre?.userId, type, title, body, link);
  }
}
