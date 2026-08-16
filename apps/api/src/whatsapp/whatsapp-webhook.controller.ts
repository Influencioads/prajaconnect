import { Body, Controller, ForbiddenException, Get, Logger, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import { WhatsappService } from './whatsapp.service';
import { WhatsappBotService } from './whatsapp-bot.service';
import { WhatsappBotConfigService } from './whatsapp-bot-config.service';

/** WhatsApp Cloud API inbound message (subset we consume). */
interface CloudApiPayload {
  entry?: {
    changes?: {
      value?: {
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: { id?: string; from?: string; type?: string; text?: { body?: string } }[];
      };
    }[];
  }[];
}

// No class-level @RequireModule here: these endpoints are called by Meta, not by users.
@Controller('whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private bot: WhatsappBotService,
    private botConfig: WhatsappBotConfigService,
  ) {}

  @Public()
  @Get('webhook')
  async verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const expected = await this.botConfig.verifyToken();
    if (mode === 'subscribe' && expected && token === expected) {
      return challenge;
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  @Public()
  @Post('webhook')
  async receive(@Body() payload: CloudApiPayload) {
    let processed = 0;
    try {
      for (const entry of payload?.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          if (!value?.messages?.length) continue;
          const contactName = value.contacts?.[0]?.profile?.name;
          for (const msg of value.messages) {
            if (msg.type !== 'text' || !msg.text?.body || !msg.from) continue;
            await this.processInbound(msg.from, msg.text.body, contactName);
            processed += 1;
          }
        }
      }
    } catch (err) {
      // Always ack with 200 so Meta does not retry-storm us; failures are logged.
      this.logger.error('Failed to process WhatsApp webhook payload', err as Error);
    }
    return { received: true, processed };
  }

  private async processInbound(from: string, text: string, contactName?: string) {
    let conv = await this.prisma.whatsappConversation.findFirst({
      where: { contactMobile: from },
      select: { id: true },
    });
    if (!conv) {
      const citizen = await this.prisma.citizen.findFirst({
        where: { mobile: { endsWith: from.slice(-10) } },
        select: { id: true },
      });
      conv = await this.prisma.whatsappConversation.create({
        data: { contactMobile: from, contactName, citizenId: citizen?.id },
        select: { id: true },
      });
    }

    // Same persistence path as the simulate-inbound endpoint.
    const message = await this.whatsapp.receiveInbound(conv.id, text);
    await this.bot
      .handleInbound(conv.id, text, message.id)
      .catch((err) => this.logger.error('Bot failed to handle inbound message', err as Error));
  }
}
