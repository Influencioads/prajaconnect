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
import { CrisisService } from './crisis.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('crisis')
@RequireModule(ModuleKey.Crisis, AccessLevel.view)
export class CrisisController {
  constructor(private readonly service: CrisisService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('issues')
  listIssues(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.service.listIssues(query, status, severity);
  }

  @Get('issues/:id')
  getIssue(@Param('id') id: string) {
    return this.service.getIssue(id);
  }

  @Post('issues')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  createIssue(
    @Body() body: {
      title: string;
      description?: string;
      severity?: string;
      villageId?: string;
      mandalId?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createIssue(body, user.id);
  }

  @Patch('issues/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  updateIssue(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      description?: string;
      severity?: string;
      status?: string;
      villageId?: string;
      mandalId?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateIssue(id, body, user.id);
  }

  @Post('issues/:id/timeline')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  addTimelineEntry(
    @Param('id') id: string,
    @Body() body: { note: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.addTimelineEntry(id, body.note, user.id);
  }

  @Get('escalations')
  listEscalations(@Query() query: PaginationDto, @Query('issueId') issueId?: string) {
    return this.service.listEscalations(query, issueId);
  }

  @Post('escalations')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  createEscalation(@Body() body: { issueId: string; level?: number; assignedToId?: string }) {
    return this.service.createEscalation(body);
  }

  @Patch('escalations/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  updateEscalation(
    @Param('id') id: string,
    @Body() body: { level?: number; assignedToId?: string },
  ) {
    return this.service.updateEscalation(id, body);
  }

  @Delete('escalations/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  deleteEscalation(@Param('id') id: string) {
    return this.service.deleteEscalation(id);
  }

  @Get('sensitive-areas')
  listSensitiveAreas(@Query() query: PaginationDto) {
    return this.service.listSensitiveAreas(query);
  }

  @Post('sensitive-areas')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  createSensitiveArea(@Body() body: { name: string; riskLevel?: string; villageId?: string }) {
    return this.service.createSensitiveArea(body);
  }

  @Patch('sensitive-areas/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  updateSensitiveArea(
    @Param('id') id: string,
    @Body() body: { name?: string; riskLevel?: string; villageId?: string },
  ) {
    return this.service.updateSensitiveArea(id, body);
  }

  @Delete('sensitive-areas/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  deleteSensitiveArea(@Param('id') id: string) {
    return this.service.deleteSensitiveArea(id);
  }

  @Get('protest-events')
  listProtestEvents(@Query() query: PaginationDto) {
    return this.service.listProtestEvents(query);
  }

  @Post('protest-events')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  createProtestEvent(
    @Body() body: { location: string; eventDate?: string; participants?: number; notes?: string },
  ) {
    return this.service.createProtestEvent(body);
  }

  @Patch('protest-events/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  updateProtestEvent(
    @Param('id') id: string,
    @Body() body: { location?: string; eventDate?: string; participants?: number; notes?: string },
  ) {
    return this.service.updateProtestEvent(id, body);
  }

  @Delete('protest-events/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  deleteProtestEvent(@Param('id') id: string) {
    return this.service.deleteProtestEvent(id);
  }

  @Get('responses')
  listEmergencyResponses(@Query() query: PaginationDto, @Query('issueId') issueId?: string) {
    return this.service.listEmergencyResponses(query, issueId);
  }

  @Post('responses')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  createEmergencyResponse(@Body() body: { issueId: string; teamName: string; status?: string }) {
    return this.service.createEmergencyResponse(body);
  }

  @Patch('responses/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  updateEmergencyResponse(
    @Param('id') id: string,
    @Body() body: { teamName?: string; status?: string },
  ) {
    return this.service.updateEmergencyResponse(id, body);
  }

  @Delete('responses/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  deleteEmergencyResponse(@Param('id') id: string) {
    return this.service.deleteEmergencyResponse(id);
  }

  @Post('responses/:id/assignments')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  createRrtAssignment(
    @Param('id') responseId: string,
    @Body() body: { cadreId: string },
  ) {
    return this.service.createRrtAssignment({ responseId, cadreId: body.cadreId });
  }

  @Delete('assignments/:id')
  @RequireModule(ModuleKey.Crisis, AccessLevel.edit)
  deleteRrtAssignment(@Param('id') id: string) {
    return this.service.deleteRrtAssignment(id);
  }

  @Get('heatmap/villages')
  heatmapVillages() {
    return this.service.heatmapVillages();
  }

  @Get('heatmap/mandals')
  heatmapMandals() {
    return this.service.heatmapMandals();
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="crisis-export.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
