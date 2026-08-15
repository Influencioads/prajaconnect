import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SecurityAuditModule } from '../security-audit/security-audit.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [SecurityAuditModule, PdfModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
