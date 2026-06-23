import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { ComplianceService } from './compliance.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('compliance')
@RequireModule(ModuleKey.Compliance, AccessLevel.view)
export class ComplianceController {
  constructor(
    private readonly service: ComplianceService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('permission-requests')
  listPermissionRequests(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.service.listPermissionRequests(query, status, type);
  }

  @Get('permission-requests/:id')
  getPermissionRequest(@Param('id') id: string) {
    return this.service.getPermissionRequest(id);
  }

  @Post('permission-requests')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  createPermissionRequest(
    @Body() body: { type: string; title: string; details?: Record<string, unknown> },
  ) {
    return this.service.createPermissionRequest(body);
  }

  @Patch('permission-requests/:id')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  updatePermissionRequest(
    @Param('id') id: string,
    @Body() body: { title?: string; status?: string; details?: Record<string, unknown> },
  ) {
    return this.service.updatePermissionRequest(id, body);
  }

  @Get('checklists')
  listChecklists(@Query() query: PaginationDto) {
    return this.service.listChecklists(query);
  }

  @Post('checklists')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  createChecklist(@Body() body: { name: string; items?: string[] }) {
    return this.service.createChecklist(body);
  }

  @Patch('checklists/:id')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  updateChecklist(
    @Param('id') id: string,
    @Body() body: { name?: string; items?: { id: string; completed: boolean }[] },
  ) {
    return this.service.updateChecklist(id, body);
  }

  @Patch('checklists/items/:itemId/toggle')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  toggleChecklistItem(
    @Param('itemId') itemId: string,
    @Body() body: { completed?: boolean },
  ) {
    return this.service.toggleChecklistItem(itemId, body.completed);
  }

  @Get('legal-notices')
  listLegalNotices(@Query() query: PaginationDto, @Query('status') status?: string) {
    return this.service.listLegalNotices(query, status);
  }

  @Get('legal-notices/:id')
  getLegalNotice(@Param('id') id: string) {
    return this.service.getLegalNotice(id);
  }

  @Post('legal-notices')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  createLegalNotice(@Body() body: { title: string; reference?: string; status?: string }) {
    return this.service.createLegalNotice(body);
  }

  @Patch('legal-notices/:id')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  updateLegalNotice(
    @Param('id') id: string,
    @Body() body: { title?: string; reference?: string; status?: string },
  ) {
    return this.service.updateLegalNotice(id, body);
  }

  @Delete('legal-notices/:id')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  deleteLegalNotice(@Param('id') id: string) {
    return this.service.deleteLegalNotice(id);
  }

  @Get('documents')
  listDocuments(
    @Query() query: PaginationDto,
    @Query('permissionRequestId') permissionRequestId?: string,
    @Query('legalNoticeId') legalNoticeId?: string,
  ) {
    return this.service.listDocuments(query, permissionRequestId, legalNoticeId);
  }

  @Post('documents')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  createDocument(
    @Body()
    body: {
      fileUrl: string;
      fileName?: string;
      permissionRequestId?: string;
      legalNoticeId?: string;
    },
  ) {
    return this.service.createDocument(body);
  }

  @Delete('documents/:id')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  deleteDocument(@Param('id') id: string) {
    return this.service.deleteDocument(id);
  }

  @Get('alerts')
  listAlerts(@Query() query: PaginationDto, @Query('resolved') resolved?: string) {
    return this.service.listAlerts(query, resolved === 'true' ? true : resolved === 'false' ? false : undefined);
  }

  @Post('alerts')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  createAlert(@Body() body: { message: string; severity?: string }) {
    return this.service.createAlert(body);
  }

  @Patch('alerts/:id/resolve')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  resolveAlert(@Param('id') id: string) {
    return this.service.resolveAlert(id);
  }

  @Get('reports/expenses')
  expenseComplianceReport() {
    return this.service.expenseComplianceReport();
  }

  @Get('reports/expenses/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="expense-compliance.csv"')
  async exportExpenseCompliance(@CurrentUser() user: AuthenticatedUser) {
    await this.securityAudit.logDataExport(user.id, 'compliance:expenses');
    return this.service.exportExpenseComplianceCsv();
  }
}
