import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrManagementService } from './pr-management.service';
import { PrAlertService } from './pr-alert.service';
import { PrRivalService } from './pr-rival.service';

@Controller('pr-management')
@RequireModule(ModuleKey.Media, AccessLevel.view)
export class PrManagementController {
  constructor(
    private readonly service: PrManagementService,
    private readonly alerts: PrAlertService,
    private readonly rivals: PrRivalService,
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
  createSource(@Body() body: { name: string; url: string; language?: string; enabled?: boolean; type?: string }) {
    return this.service.createSource(body);
  }

  @Post('sources/google-news')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createGoogleNewsSource(@Body() body: { query: string }) {
    return this.service.createGoogleNewsSource(body.query);
  }

  @Patch('sources/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateSource(
    @Param('id') id: string,
    @Body() body: { name?: string; url?: string; language?: string; enabled?: boolean; type?: string },
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

  @Get('rivals')
  listRivals() {
    return this.rivals.listRivals();
  }

  @Post('rivals')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createRival(@Body() body: { name: string; party?: string; aliases?: string[]; active?: boolean }) {
    return this.rivals.createRival(body);
  }

  @Patch('rivals/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateRival(
    @Param('id') id: string,
    @Body() body: { name?: string; party?: string; aliases?: string[]; active?: boolean },
  ) {
    return this.rivals.updateRival(id, body);
  }

  @Delete('rivals/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  deleteRival(@Param('id') id: string) {
    return this.rivals.deleteRival(id);
  }

  @Get('rivals/:id/timeline')
  rivalTimeline(@Param('id') id: string) {
    return this.rivals.timeline(id);
  }

  @Get('rival-mentions')
  listRivalMentions(@Query() query: PaginationDto, @Query('rivalId') rivalId?: string) {
    return this.rivals.listMentions(query, rivalId);
  }
}
