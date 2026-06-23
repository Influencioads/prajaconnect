import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrManagementService } from './pr-management.service';
import { PrConfigService } from './pr-config.service';

@Injectable()
export class PrManagementCron {
  private readonly logger = new Logger(PrManagementCron.name);

  constructor(
    private readonly pr: PrManagementService,
    private readonly config: PrConfigService,
  ) {}

  /** Runs every 4 hours at minute 0 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00). */
  @Cron('0 */4 * * *')
  async runScheduledCycle() {
    try {
      if (!(await this.config.isCronEnabled())) return;
      const result = await this.pr.runCycle(false);
      if (result.runId) {
        this.logger.log(`PR cycle completed: ${result.status} (run ${result.runId})`);
      }
    } catch (err) {
      this.logger.error('Scheduled PR cycle failed', err as Error);
    }
  }
}
