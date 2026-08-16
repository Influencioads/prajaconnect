import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GrievanceSlaService } from './grievance-sla.service';
import { OpsAlertsService } from '../ops-alerts/ops-alerts.service';

@Injectable()
export class GrievanceSlaCron {
  private readonly logger = new Logger(GrievanceSlaCron.name);

  constructor(
    private readonly sla: GrievanceSlaService,
    private readonly opsAlerts: OpsAlertsService,
  ) {}

  /** Runs at the start of every hour. */
  @Cron('0 * * * *')
  async scanSlaViolations() {
    try {
      if (await this.sla.isCronEnabled()) {
        const result = await this.sla.scanAll();
        if (result.validationCreated || result.resolutionCreated) {
          this.logger.log(
            `SLA scan: ${result.validationCreated} validation + ${result.resolutionCreated} resolution violation(s) created`,
          );
        }
      }
    } catch (err) {
      this.logger.error('Grievance SLA scan failed', err as Error);
    }

    // At-risk warnings + breach escalation up the directory matrix (ops-alerts).
    try {
      if (await this.opsAlerts.isEnabled()) {
        const esc = await this.opsAlerts.runSlaEscalationScan();
        if (esc.atRisk || esc.breached || esc.escalated) {
          this.logger.log(
            `SLA escalation: ${esc.atRisk} at-risk warning(s), ${esc.breached} breach notice(s), ${esc.escalated} escalation(s)`,
          );
        }
      }
    } catch (err) {
      this.logger.error('SLA escalation scan failed', err as Error);
    }
  }
}
