import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BulletinService } from './bulletin.service';

const IST = 'Asia/Kolkata';

@Injectable()
export class BulletinCron {
  private readonly logger = new Logger(BulletinCron.name);

  constructor(private readonly bulletin: BulletinService) {}

  /** Daily 5:00 AM IST flagship bulletin. */
  @Cron('0 5 * * *', { timeZone: IST })
  async daily() {
    await this.runSafe('daily');
  }

  /** Weekly edition — Mondays 6:00 AM IST. */
  @Cron('0 6 * * 1', { timeZone: IST })
  async weekly() {
    await this.runSafe('weekly');
  }

  /** Monthly edition — 1st of the month 6:00 AM IST. */
  @Cron('0 6 1 * *', { timeZone: IST })
  async monthly() {
    await this.runSafe('monthly');
  }

  private async runSafe(edition: string) {
    try {
      if (!(await this.bulletin.isEnabled())) return;
      const result = await this.bulletin.run(undefined, edition, { skipIfExists: true });
      this.logger.log(`Scheduled ${edition} bulletin done (${result.id})`);
    } catch (err) {
      this.logger.error(`Scheduled ${edition} bulletin failed`, err as Error);
    }
  }
}
