import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JobsService } from './jobs.service';

@Injectable()
export class JobsCron {
  private readonly logger = new Logger(JobsCron.name);

  constructor(private readonly jobs: JobsService) {}

  /** Runs every 6 hours at minute 0 (00:00, 06:00, 12:00, 18:00). */
  @Cron('0 */6 * * *')
  async runScheduledCycle() {
    try {
      const result = await this.jobs.runCycle(false);
      if (result.status !== 'disabled') {
        this.logger.log(`Jobs cycle completed: ${result.status} (${result.postingsNew} new)`);
      }
    } catch (err) {
      this.logger.error('Scheduled jobs cycle failed', err as Error);
    }
  }
}
