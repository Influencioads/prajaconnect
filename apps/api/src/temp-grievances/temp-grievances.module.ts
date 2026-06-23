import { Module } from '@nestjs/common';
import { GrievancesModule } from '../grievances/grievances.module';
import { TempGrievancesController } from './temp-grievances.controller';
import { TempGrievancesService } from './temp-grievances.service';
import { TempGrievancesAiService } from './temp-grievances-ai.service';
import { TempGrievancesReportsService } from './temp-grievances-reports.service';

@Module({
  imports: [GrievancesModule],
  controllers: [TempGrievancesController],
  providers: [TempGrievancesService, TempGrievancesAiService, TempGrievancesReportsService],
  exports: [TempGrievancesService, TempGrievancesAiService],
})
export class TempGrievancesModule {}
