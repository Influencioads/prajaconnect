import { Body, Controller, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { WarRoomService } from './war-room.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('war-room')
@RequireModule(ModuleKey.WarRoom, AccessLevel.view)
export class WarRoomController {
  constructor(private readonly service: WarRoomService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('alerts')
  alerts(@Query() query: PaginationDto & { resolved?: string; severity?: string }) {
    return this.service.listAlerts(query);
  }

  @Post('alerts')
  @RequireModule(ModuleKey.WarRoom, AccessLevel.edit)
  createAlert(@Body() body: { title: string; message: string; severity?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createAlert(body, user.id);
  }

  @Patch('alerts/:id/resolve')
  @RequireModule(ModuleKey.WarRoom, AccessLevel.edit)
  resolveAlert(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.resolveAlert(id, user.id);
  }

  @Get('escalations')
  escalations(@Query() query: PaginationDto & { status?: string }) {
    return this.service.listEscalations(query);
  }

  @Get('escalations/:id')
  getEscalation(@Param('id') id: string) {
    return this.service.getEscalation(id);
  }

  @Post('escalations')
  @RequireModule(ModuleKey.WarRoom, AccessLevel.edit)
  createEscalation(@Body() body: { title: string; description?: string; priority?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createEscalation(body, user.id);
  }

  @Patch('escalations/:id')
  @RequireModule(ModuleKey.WarRoom, AccessLevel.edit)
  updateEscalation(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.service.updateEscalation(id, body as { status?: string; assignedToId?: string }, user.id);
  }

  @Get('readiness/booths')
  readinessBooths(@Query() query: PaginationDto) {
    return this.service.listReadinessBooths(query);
  }

  @Get('readiness/mandals')
  readinessMandals(@Query() query: PaginationDto) {
    return this.service.listReadinessMandals(query);
  }

  @Get('activity-feed')
  activityFeed(@Query() query: PaginationDto) {
    return this.service.listActivityFeed(query);
  }

  @Get('briefings')
  briefings(@Query() query: PaginationDto) {
    return this.service.listBriefings(query);
  }

  @Post('briefing')
  @RequireModule(ModuleKey.WarRoom, AccessLevel.edit)
  briefing(@CurrentUser() user: AuthenticatedUser) {
    return this.service.generateBriefing(user.id);
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="war-room.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
