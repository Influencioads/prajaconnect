import { Module } from '@nestjs/common';
import { GrievancesService } from './grievances.service';
import { GrievancesController } from './grievances.controller';
import { GrievanceSlaService } from './grievance-sla.service';
import { GrievanceSlaCron } from './grievance-sla.cron';

@Module({
  controllers: [GrievancesController],
  providers: [GrievancesService, GrievanceSlaService, GrievanceSlaCron],
  exports: [GrievanceSlaService],
})
export class GrievancesModule {}
