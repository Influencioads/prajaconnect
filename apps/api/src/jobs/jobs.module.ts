import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core/ai-core.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsCron } from './jobs.cron';

@Module({
  imports: [AiCoreModule, NotificationsModule],
  controllers: [JobsController],
  providers: [JobsService, JobsCron],
  exports: [JobsService],
})
export class JobsModule {}
