import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesReminderCron } from './activities.cron';
import { TempGrievancesModule } from '../temp-grievances/temp-grievances.module';

@Module({
  imports: [TempGrievancesModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitiesReminderCron],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
