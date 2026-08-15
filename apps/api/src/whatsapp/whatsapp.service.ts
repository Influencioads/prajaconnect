import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TempGrievancesService } from '../temp-grievances/temp-grievances.service';
import { WhatsappAdapter } from '../notifications/channels/whatsapp.adapter';

@Injectable()
export class WhatsappService {
  constructor(
    private prisma: PrismaService,
    private tempGrievances: TempGrievancesService,
    private adapter: WhatsappAdapter,
  ) {}

  async conversations(search?: string) {
    return this.prisma.whatsappConversation.findMany({
      where: search
        ? {
            OR: [
              { contactName: { contains: search, mode: 'insensitive' } },
              { contactMobile: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        citizen: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async conversation(id: string) {
    const conv = await this.prisma.whatsappConversation.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, mobile: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.unreadCount > 0) {
      await this.prisma.whatsappConversation.update({
        where: { id },
        data: { unreadCount: 0 },
      });
    }
    return conv;
  }

  async sendMessage(id: string, body: string) {
    const conv = await this.prisma.whatsappConversation.findUnique({
      where: { id },
      select: { id: true, contactMobile: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    const result = await this.adapter.sendText(conv.contactMobile, body);
    const status = result.simulated || result.sent ? 'Sent' : 'Failed';
    const message = await this.prisma.whatsappMessage.create({
      data: { conversationId: id, direction: 'Outbound', body, status },
    });
    await this.prisma.whatsappConversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  async receiveInbound(conversationId: string, body: string) {
    const conv = await this.prisma.whatsappConversation.findUnique({ where: { id: conversationId }, select: { id: true } });
    if (!conv) throw new NotFoundException('Conversation not found');

    const message = await this.prisma.whatsappMessage.create({
      data: { conversationId, direction: 'Inbound', body, status: 'Delivered' },
    });
    await this.prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
    });

    await this.tempGrievances.tryAutoCreateFromWhatsappMessage(conversationId, body, message.id).catch(() => undefined);
    return message;
  }

  async broadcast(body: string, audience?: string) {
    if (!(await this.adapter.isConfigured())) {
      const recipients = await this.prisma.whatsappConversation.count();
      return {
        queued: true,
        recipients,
        audience: audience ?? 'all-contacts',
        preview: body.slice(0, 120),
        note: 'Broadcast simulated — connect WhatsApp Business API to deliver.',
      };
    }

    const conversations = await this.prisma.whatsappConversation.findMany({
      select: { contactMobile: true },
    });
    let sent = 0;
    for (const conv of conversations) {
      const result = await this.adapter.sendText(conv.contactMobile, body);
      if (result.sent) sent += 1;
    }
    return {
      queued: true,
      recipients: conversations.length,
      sent,
      audience: audience ?? 'all-contacts',
      preview: body.slice(0, 120),
    };
  }
}
