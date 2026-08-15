import { Module } from '@nestjs/common';
import { GrievancesService } from './grievances.service';
import { GrievancesController } from './grievances.controller';
import { GrievanceSlaService } from './grievance-sla.service';
import { GrievanceSlaCron } from './grievance-sla.cron';
import { NotificationsModule } from '../notifications/notifications.module';
import { OpsAlertsModule } from '../ops-alerts/ops-alerts.module';

@Module({
  imports: [NotificationsModule, OpsAlertsModule],
  controllers: [GrievancesController],
  providers: [GrievancesService, GrievanceSlaService, GrievanceSlaCron],
  exports: [GrievanceSlaService],
})
export class GrievancesModule {}
