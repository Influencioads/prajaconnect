import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OpsAlertsService } from './ops-alerts.service';

@Injectable()
export class OpsAlertsCron {
  private readonly logger = new Logger(OpsAlertsCron.name);

  constructor(private readonly ops: OpsAlertsService) {}

  /** Daily at 06:30 — inactive cadre + dark zone snapshot. */
  @Cron('30 6 * * *')
  async dailyOpsScan() {
    try {
      if (!(await this.ops.isEnabled())) return;
      const r = await this.ops.runDailyScan();
      this.logger.log(
        `Ops daily scan: ${r.inactiveCadre} inactive cadre, ${r.darkVillages} dark villages, ${r.darkBooths} dark booths, ${r.parentsNotified} parent(s) notified`,
      );
    } catch (err) {
      this.logger.error('Ops daily scan failed', err as Error);
    }
  }
}
