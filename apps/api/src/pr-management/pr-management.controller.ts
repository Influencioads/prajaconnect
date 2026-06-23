import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrManagementService } from './pr-management.service';
import { PrAlertService } from './pr-alert.service';

@Controller('pr-management')
@RequireModule(ModuleKey.Media, AccessLevel.view)
export class PrManagementController {
  constructor(
    private readonly service: PrManagementService,
    private readonly alerts: PrAlertService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('reports')
  listReports(@Query() query: PaginationDto) {
    return this.service.listReports(query);
  }

  @Get('reports/:id')
  getReport(@Param('id') id: string) {
    return this.service.getReport(id);
  }

  @Get('alerts')
  listAlerts(
    @Query() query: PaginationDto,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listAlerts({ ...query, type, severity, status });
  }

  @Patch('alerts/:id/acknowledge')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  acknowledge(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.alerts.acknowledge(id, user.id);
  }

  @Patch('alerts/:id/resolve')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  resolve(@Param('id') id: string) {
    return this.alerts.resolve(id);
  }

  @Get('sources')
  listSources() {
    return this.service.listSources();
  }

  @Post('sources')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createSource(@Body() body: { name: string; url: string; language?: string; enabled?: boolean }) {
    return this.service.createSource(body);
  }

  @Patch('sources/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateSource(
    @Param('id') id: string,
    @Body() body: { name?: string; url?: string; language?: string; enabled?: boolean },
  ) {
    return this.service.updateSource(id, body);
  }

  @Delete('sources/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  deleteSource(@Param('id') id: string) {
    return this.service.deleteSource(id);
  }

  @Post('sources/test')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  testSource(@Body() body: { url: string }) {
    return this.service.testSource(body.url);
  }

  @Post('run')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  runNow() {
    return this.service.runCycle(true);
  }

  @Get('runs')
  listRuns(@Query() query: PaginationDto) {
    return this.service.listRuns(query);
  }

  @Get('briefing')
  briefing() {
    return this.service.getLatestBriefing();
  }
}
