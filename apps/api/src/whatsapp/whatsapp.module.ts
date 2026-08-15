import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { TempGrievancesModule } from '../temp-grievances/temp-grievances.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TempGrievancesModule, NotificationsModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}
