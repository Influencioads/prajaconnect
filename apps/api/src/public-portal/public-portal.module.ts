import { Module } from '@nestjs/common';
import { PublicPortalController } from './public-portal.controller';
import { PublicPortalService } from './public-portal.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PublicPortalController],
  providers: [PublicPortalService],
  exports: [PublicPortalService],
})
export class PublicPortalModule {}
