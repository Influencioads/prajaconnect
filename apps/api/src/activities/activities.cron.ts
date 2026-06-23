import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivitiesService } from './activities.service';

/**
 * Periodically converts due activity reminders into notifications.
 * Runs every minute; each reminder is dispatched once (sent flag).
 */
@Injectable()
export class ActivitiesReminderCron {
  private readonly logger = new Logger(ActivitiesReminderCron.name);

  constructor(private readonly activities: ActivitiesService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDueReminders() {
    try {
      const { dispatched } = await this.activities.dispatchDueReminders();
      if (dispatched > 0) {
        this.logger.log(`Dispatched ${dispatched} activity reminder(s)`);
      }
    } catch (err) {
      this.logger.error('Failed to dispatch activity reminders', err as Error);
    }
  }
}
