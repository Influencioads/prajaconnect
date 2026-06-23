import { Controller, Get, Header, Param, Patch, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { SecurityAuditService } from './security-audit.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('security-audit')
@RequireModule(ModuleKey.SecurityAudit, AccessLevel.view)
export class SecurityAuditController {
  constructor(private readonly service: SecurityAuditService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('login-history')
  loginHistory(@Query() query: PaginationDto, @Query('userId') userId?: string) {
    return this.service.loginHistory(query, userId);
  }

  @Get('sessions')
  listSessions(@Query() query: PaginationDto) {
    return this.service.listSessions(query);
  }

  @Patch('sessions/:id/revoke')
  @RequireModule(ModuleKey.SecurityAudit, AccessLevel.edit)
  revokeSession(@Param('id') id: string) {
    return this.service.revokeSession(id);
  }

  @Get('export-logs')
  exportLogs(@Query() query: PaginationDto) {
    return this.service.exportLogs(query);
  }

  @Get('export-logs/download')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="export-logs.csv"')
  downloadExportLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.service.downloadExportLogs(user.id);
  }

  @Get('role-activity')
  roleActivity(@Query() query: PaginationDto) {
    return this.service.roleActivity(query);
  }

  @Get('file-access')
  fileAccess(@Query() query: PaginationDto) {
    return this.service.fileAccess(query);
  }

  @Get('suspicious-alerts')
  suspiciousAlerts(@Query() query: PaginationDto, @Query('resolved') resolved?: string) {
    return this.service.suspiciousAlerts(query, resolved);
  }

  @Patch('alerts/:id/resolve')
  @RequireModule(ModuleKey.SecurityAudit, AccessLevel.edit)
  resolveAlert(@Param('id') id: string) {
    return this.service.resolveAlert(id);
  }

  @Get('backup-logs')
  backupLogs(@Query() query: PaginationDto) {
    return this.service.backupLogs(query);
  }

  @Get('permissions/audit')
  permissionAudit() {
    return this.service.permissionAuditDiff();
  }
}
