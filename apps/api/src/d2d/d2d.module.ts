import { Module } from '@nestjs/common';
import {
  D2dAnalyticsController,
  D2dAssignmentsController,
  D2dReportsController,
  D2dResponsesController,
  D2dSurveysController,
  D2dSyncController,
} from './d2d.controller';
import { D2dService } from './d2d.service';
import { D2dAnalyticsService } from './d2d-analytics.service';
import { D2dReportsService } from './d2d-reports.service';
import { D2dSyncService } from './d2d-sync.service';
import { TempGrievancesModule } from '../temp-grievances/temp-grievances.module';

@Module({
  imports: [TempGrievancesModule],
  controllers: [
    D2dSurveysController,
    D2dAssignmentsController,
    D2dResponsesController,
    D2dAnalyticsController,
    D2dReportsController,
    D2dSyncController,
  ],
  providers: [D2dService, D2dAnalyticsService, D2dReportsService, D2dSyncService],
  exports: [D2dService],
})
export class D2dModule {}
