import { Module } from '@nestjs/common';
import { OpsAlertsService } from './ops-alerts.service';
import { OpsAlertsController } from './ops-alerts.controller';
import { OpsAlertsCron } from './ops-alerts.cron';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [OpsAlertsController],
  providers: [OpsAlertsService, OpsAlertsCron],
  exports: [OpsAlertsService],
})
export class OpsAlertsModule {}
