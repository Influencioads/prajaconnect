import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationDispatchService } from './dispatch.service';
import { ExpoPushAdapter } from './channels/expo-push.adapter';
import { WhatsappAdapter } from './channels/whatsapp.adapter';
import { SmsAdapter } from './channels/sms.adapter';
import { EmailAdapter } from './channels/email.adapter';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatchService,
    ExpoPushAdapter,
    WhatsappAdapter,
    SmsAdapter,
    EmailAdapter,
  ],
  exports: [NotificationDispatchService, ExpoPushAdapter, WhatsappAdapter, SmsAdapter, EmailAdapter],
})
export class NotificationsModule {}
