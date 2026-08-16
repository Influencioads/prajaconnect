import { Module } from '@nestjs/common';
import { GrievancesService } from './grievances.service';
import { GrievancesController } from './grievances.controller';
import { GrievanceSlaService } from './grievance-sla.service';
import { GrievanceSlaCron } from './grievance-sla.cron';
import { GrievanceAiService } from './grievance-ai.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiCoreModule } from '../ai-core/ai-core.module';
import { OpsAlertsModule } from '../ops-alerts/ops-alerts.module';

@Module({
  imports: [NotificationsModule, AiCoreModule, OpsAlertsModule],
  controllers: [GrievancesController],
  providers: [GrievancesService, GrievanceSlaService, GrievanceSlaCron, GrievanceAiService],
  exports: [GrievanceSlaService, GrievanceAiService],
})
export class GrievancesModule {}
