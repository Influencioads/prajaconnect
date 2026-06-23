import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { ReportsService, ReportType } from './reports.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('reports')
@RequireModule(ModuleKey.Reports, AccessLevel.view)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  @Get()
  list() {
    return this.reports.summary();
  }

  @Get('export/:type')
  async exportCsv(
    @Param('type') type: ReportType,
    @Res() res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { filename, csv } = await this.reports.generateCsv(type);
    await this.securityAudit.logDataExport(user.id, `report:${type}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('export-pdf/:type')
  exportPdf(@Param('type') type: ReportType) {
    return {
      status: 'not_implemented',
      type,
      message: 'PDF export is not yet available. Use CSV export. PDF rendering is planned via a server-side renderer.',
    };
  }
}
