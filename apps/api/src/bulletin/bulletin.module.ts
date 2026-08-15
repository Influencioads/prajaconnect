import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core/ai-core.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';
import { BulletinController } from './bulletin.controller';
import { BulletinService } from './bulletin.service';
import { BulletinAggregationService } from './bulletin-aggregation.service';
import { BulletinNarrativeService } from './bulletin-narrative.service';
import { BulletinPdfService } from './bulletin-pdf.service';
import { BulletinCron } from './bulletin.cron';

@Module({
  imports: [AiCoreModule, NotificationsModule, PdfModule],
  controllers: [BulletinController],
  providers: [
    BulletinService,
    BulletinAggregationService,
    BulletinNarrativeService,
    BulletinPdfService,
    BulletinCron,
  ],
  exports: [BulletinService],
})
export class BulletinModule {}
