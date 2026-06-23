import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { CallCenterService } from './call-center.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('call-center')
@RequireModule(ModuleKey.CallCenter, AccessLevel.view)
export class CallCenterController {
  constructor(private readonly service: CallCenterService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('queues')
  listQueues() {
    return this.service.listQueues();
  }

  @Post('queues')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  createQueue(@Body() body: { name: string; priority?: number }) {
    return this.service.createQueue(body);
  }

  @Patch('queues/:id')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  updateQueue(@Param('id') id: string, @Body() body: { name?: string; priority?: number }) {
    return this.service.updateQueue(id, body);
  }

  @Delete('queues/:id')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.full)
  deleteQueue(@Param('id') id: string) {
    return this.service.deleteQueue(id);
  }

  @Get('calls')
  listCalls(@Query() query: PaginationDto) {
    return this.service.listCalls(query);
  }

  @Get('calls/:id')
  getCall(@Param('id') id: string) {
    return this.service.getCall(id);
  }

  @Post('calls')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  createCall(
    @Body()
    body: {
      direction?: string;
      callerNumber?: string;
      disposition?: string;
      durationSec?: number;
      notes?: string;
      agentId?: string;
      queueId?: string;
    },
  ) {
    return this.service.createCall(body);
  }

  @Patch('calls/:id')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  updateCall(
    @Param('id') id: string,
    @Body()
    body: {
      direction?: string;
      callerNumber?: string;
      disposition?: string;
      durationSec?: number;
      notes?: string;
      agentId?: string;
      queueId?: string;
    },
  ) {
    return this.service.updateCall(id, body);
  }

  @Post('calls/:id/create-temp-grievance')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  createTempGrievance(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body?: { notes?: string },
  ) {
    return this.service.createTempGrievanceFromCall(id, user, body);
  }

  @Get('follow-ups')
  listFollowUps(@Query() query: PaginationDto, @Query('completed') completed?: string) {
    const flag =
      completed === 'true' ? true : completed === 'false' ? false : undefined;
    return this.service.listFollowUps(query, flag);
  }

  @Post('follow-ups')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  createFollowUp(@Body() body: { callLogId: string; dueAt: string }) {
    return this.service.createFollowUp(body);
  }

  @Patch('follow-ups/:id')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  updateFollowUp(@Param('id') id: string, @Body() body: { dueAt?: string; completed?: boolean }) {
    return this.service.updateFollowUp(id, body);
  }

  @Delete('follow-ups/:id')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.full)
  deleteFollowUp(@Param('id') id: string) {
    return this.service.deleteFollowUp(id);
  }

  @Get('agents')
  listAgents() {
    return this.service.listAgents();
  }

  @Get('scripts')
  listScripts() {
    return this.service.listScripts();
  }

  @Post('scripts')
  @RequireModule(ModuleKey.CallCenter, AccessLevel.edit)
  createScript(@Body() body: { title: string; content: string }) {
    return this.service.createScript(body);
  }

  @Get('reports/agent-performance')
  agentPerformance() {
    return this.service.agentPerformance();
  }

  @Get('reports/disposition')
  dispositionReport() {
    return this.service.dispositionReport();
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="call-center.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
