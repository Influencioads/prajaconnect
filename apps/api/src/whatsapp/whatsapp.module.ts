import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappBotService } from './whatsapp-bot.service';
import { WhatsappBotConfigService } from './whatsapp-bot-config.service';
import { TempGrievancesModule } from '../temp-grievances/temp-grievances.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PublicPortalModule } from '../public-portal/public-portal.module';

@Module({
  imports: [TempGrievancesModule, NotificationsModule, PublicPortalModule],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [WhatsappService, WhatsappBotService, WhatsappBotConfigService],
})
export class WhatsappModule {}
