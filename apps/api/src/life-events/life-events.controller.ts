import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LifeEventsService } from './life-events.service';

@Controller('life-events')
@RequireModule(ModuleKey.LifeEvents, AccessLevel.view)
export class LifeEventsController {
  constructor(private readonly service: LifeEventsService) {}

  @Get('today')
  today() {
    return this.service.today();
  }

  @Get('upcoming')
  upcoming(@Query('days') days?: string) {
    return this.service.upcoming(Number(days) || 7);
  }

  @Post('run')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  runNow() {
    return this.service.runDaily();
  }

  // ---- greeting queue ----
  @Get('queue')
  listQueue(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('occasion') occasion?: string,
  ) {
    return this.service.listQueue(query, status, occasion);
  }

  @Patch('queue/:id/approve')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  approve(@Param('id') id: string) {
    return this.service.setQueueStatus(id, 'Approved');
  }

  @Patch('queue/:id/skip')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  skip(@Param('id') id: string) {
    return this.service.setQueueStatus(id, 'Skipped');
  }

  @Post('queue/:id/send')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  send(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.sendQueueItem(id, user.id);
  }

  @Post('queue/bulk-send')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  bulkSend(@Body() body: { ids?: string[] }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.bulkSend(body?.ids, user.id);
  }

  // ---- greeting templates ----
  @Get('templates')
  listTemplates(@Query('occasion') occasion?: string) {
    return this.service.listTemplates(occasion);
  }

  @Post('templates')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  createTemplate(
    @Body() body: { occasion: string; language?: string; body: string; active?: boolean },
  ) {
    return this.service.createTemplate(body);
  }

  @Patch('templates/:id')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  updateTemplate(
    @Param('id') id: string,
    @Body() body: { occasion?: string; language?: string; body?: string; active?: boolean },
  ) {
    return this.service.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // ---- condolence log ----
  @Get('condolences')
  listCondolences(@Query() query: PaginationDto) {
    return this.service.listCondolences(query);
  }

  @Post('condolences')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  createCondolence(
    @Body() body: { citizenId?: string; name: string; date?: string; notes?: string; mobile?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createCondolence(body, user.id);
  }

  @Patch('condolences/:id')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  updateCondolence(
    @Param('id') id: string,
    @Body() body: { name?: string; date?: string; notes?: string; citizenId?: string | null },
  ) {
    return this.service.updateCondolence(id, body);
  }

  @Delete('condolences/:id')
  @RequireModule(ModuleKey.LifeEvents, AccessLevel.edit)
  deleteCondolence(@Param('id') id: string) {
    return this.service.deleteCondolence(id);
  }
}
