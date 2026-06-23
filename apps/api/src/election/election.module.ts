import { Module } from '@nestjs/common';
import { ElectionCommonService } from './election-common.service';
import { ElectionDashboardService } from './election-dashboard.service';
import { ElectionDashboardController } from './election-dashboard.controller';
import { ElectionExpensesService } from './election-expenses.service';
import { ElectionExpensesController } from './election-expenses.controller';
import { ElectionWorksService } from './election-works.service';
import { ElectionWorksController } from './election-works.controller';
import { ElectionVehiclesService } from './election-vehicles.service';
import { ElectionVehiclesController } from './election-vehicles.controller';
import { ElectionBoothsService } from './election-booths.service';
import { ElectionBoothsController } from './election-booths.controller';
import { ElectionOutreachService } from './election-outreach.service';
import { ElectionOutreachController } from './election-outreach.controller';
import { ElectionTeamsService } from './election-teams.service';
import { ElectionTeamsController } from './election-teams.controller';
import { ElectionMaterialsService } from './election-materials.service';
import { ElectionMaterialsController } from './election-materials.controller';
import { ElectionPollingDayService } from './election-polling-day.service';
import { ElectionPollingDayController } from './election-polling-day.controller';
import { ElectionReportsService, ElectionSettingsService } from './election-reports.service';
import { ElectionReportsController } from './election-reports.controller';
import { ElectionSettingsController } from './election-settings.controller';

@Module({
  controllers: [
    ElectionDashboardController,
    ElectionExpensesController,
    ElectionWorksController,
    ElectionVehiclesController,
    ElectionBoothsController,
    ElectionOutreachController,
    ElectionTeamsController,
    ElectionMaterialsController,
    ElectionPollingDayController,
    ElectionReportsController,
    ElectionSettingsController,
  ],
  providers: [
    ElectionCommonService,
    ElectionDashboardService,
    ElectionExpensesService,
    ElectionWorksService,
    ElectionVehiclesService,
    ElectionBoothsService,
    ElectionOutreachService,
    ElectionTeamsService,
    ElectionMaterialsService,
    ElectionPollingDayService,
    ElectionReportsService,
    ElectionSettingsService,
  ],
})
export class ElectionModule {}
