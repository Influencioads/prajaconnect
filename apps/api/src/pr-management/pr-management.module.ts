import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { PrManagementController } from './pr-management.controller';
import { PrManagementService } from './pr-management.service';
import { PrConfigService } from './pr-config.service';
import { PrIngestionService } from './pr-ingestion.service';
import { PrOpenAiService } from './pr-openai.service';
import { PrAnalysisService } from './pr-analysis.service';
import { PrReportService } from './pr-report.service';
import { PrAlertService } from './pr-alert.service';
import { PrManagementCron } from './pr-management.cron';

@Module({
  imports: [MediaModule],
  controllers: [PrManagementController],
  providers: [
    PrManagementService,
    PrConfigService,
    PrIngestionService,
    PrOpenAiService,
    PrAnalysisService,
    PrReportService,
    PrAlertService,
    PrManagementCron,
  ],
  exports: [PrManagementService],
})
export class PrManagementModule {}
