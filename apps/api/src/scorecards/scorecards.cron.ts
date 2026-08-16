import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScorecardsService } from './scorecards.service';

@Injectable()
export class ScorecardsCron {
  private readonly logger = new Logger(ScorecardsCron.name);

  constructor(private readonly service: ScorecardsService) {}

  /** Daily at 05:30 — scores yesterday once the previous day's field data has settled. */
  @Cron('30 5 * * *')
  async runDaily() {
    try {
      if (!(await this.service.isEnabled())) {
        this.logger.log('Scorecards cron skipped (scorecards_enabled=false)');
        return;
      }
      await this.service.runDaily();
    } catch (err) {
      this.logger.error('Scheduled scorecard run failed', err as Error);
    }
  }
}
