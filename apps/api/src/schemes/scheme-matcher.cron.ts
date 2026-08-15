import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SchemeMatcherService } from './scheme-matcher.service';

@Injectable()
export class SchemeMatcherCron {
  private readonly logger = new Logger(SchemeMatcherCron.name);

  constructor(private readonly matcher: SchemeMatcherService) {}

  /** Nightly at 02:00 — toggled via the `scheme_matcher_enabled` setting. */
  @Cron('0 2 * * *')
  async runNightly() {
    try {
      if (!(await this.matcher.isEnabled())) return;
      const result = await this.matcher.run();
      this.logger.log(
        `Nightly scheme matcher done: ${result.created} created, ${result.updated} updated`,
      );
    } catch (err) {
      this.logger.error('Nightly scheme matcher failed', err as Error);
    }
  }
}
