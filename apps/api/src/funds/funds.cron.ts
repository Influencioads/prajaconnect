import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FundsService } from './funds.service';

@Injectable()
export class FundsCron {
  private readonly logger = new Logger(FundsCron.name);

  constructor(private readonly funds: FundsService) {}

  /** Monthly on the 1st at 09:00 — warn leaders about under-utilized fund sources. */
  @Cron('0 9 1 * *')
  async runMonthlyUnspentAlert() {
    try {
      if (!(await this.funds.isAlertCronEnabled())) return;
      const result = await this.funds.runUnspentAlert();
      this.logger.log(
        `Fund unspent alert cycle: checked ${result.checked}, alerted ${result.alerted}, notified ${result.notified}`,
      );
    } catch (err) {
      this.logger.error('Monthly fund unspent alert failed', err as Error);
    }
  }
}
