import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core/ai-core.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LifeEventsController } from './life-events.controller';
import { LifeEventsService } from './life-events.service';
import { LifeEventsCron } from './life-events.cron';

@Module({
  imports: [AiCoreModule, NotificationsModule],
  controllers: [LifeEventsController],
  providers: [LifeEventsService, LifeEventsCron],
})
export class LifeEventsModule {}
