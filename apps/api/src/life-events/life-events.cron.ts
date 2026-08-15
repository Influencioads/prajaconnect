import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LifeEventsService } from './life-events.service';

@Injectable()
export class LifeEventsCron {
  private readonly logger = new Logger(LifeEventsCron.name);

  constructor(private readonly service: LifeEventsService) {}

  /** Daily at 04:00 — enqueue today's greetings and upcoming deadline reminders. */
  @Cron('0 4 * * *')
  async runDaily() {
    try {
      if (!(await this.service.isCronEnabled())) return;
      const result = await this.service.runDaily();
      this.logger.log(`Life events cron completed: ${result.enqueued} item(s) enqueued`);
    } catch (err) {
      this.logger.error('Life events cron failed', err as Error);
    }
  }
}
