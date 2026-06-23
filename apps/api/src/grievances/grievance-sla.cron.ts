import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GrievanceSlaService } from './grievance-sla.service';

@Injectable()
export class GrievanceSlaCron {
  private readonly logger = new Logger(GrievanceSlaCron.name);

  constructor(private readonly sla: GrievanceSlaService) {}

  /** Runs at the start of every hour. */
  @Cron('0 * * * *')
  async scanSlaViolations() {
    try {
      if (!(await this.sla.isCronEnabled())) return;
      const result = await this.sla.scanAll();
      if (result.validationCreated || result.resolutionCreated) {
        this.logger.log(
          `SLA scan: ${result.validationCreated} validation + ${result.resolutionCreated} resolution violation(s) created`,
        );
      }
    } catch (err) {
      this.logger.error('Grievance SLA scan failed', err as Error);
    }
  }
}
