import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, ActivityType, ModuleKey } from '@praja/types';
import { ActivitiesService } from './activities.service';
import {
  AddActivityNoteDto,
  AddParticipantDto,
  AddReminderDto,
  ActivityCalendarQueryDto,
  ActivityQueryDto,
  ActivityTimelineQueryDto,
  CampaignQueryDto,
  ChangeActivityStatusDto,
  CompleteActivityDto,
  CreateActivityDto,
  CreateCampaignDto,
  UpdateActivityDto,
  UpdateCampaignDto,
} from './dto/activity.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('activities')
@RequireModule(ModuleKey.Activities, AccessLevel.view)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  list(@Query() query: ActivityQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.activities.list(query, user);
  }

  @Get('stats')
  stats(@Query('type') type?: ActivityType) {
    return this.activities.stats({ type });
  }

  @Get('options')
  options() {
    return this.activities.options();
  }

  @Get('calendar')
  calendar(@Query() query: ActivityCalendarQueryDto) {
    return this.activities.calendar(query);
  }

  @Get('timeline')
  timeline(@Query() query: ActivityTimelineQueryDto) {
    return this.activities.timeline(query);
  }

  @Get('reminders/due')
  dueReminders(@CurrentUser() user: AuthenticatedUser) {
    return this.activities.dueReminders(user);
  }

  // ---- Campaigns ----
  @Get('campaigns')
  listCampaigns(@Query() query: CampaignQueryDto) {
    return this.activities.listCampaigns(query);
  }

  @Post('campaigns')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  createCampaign(@Body() dto: CreateCampaignDto, @CurrentUser() user: AuthenticatedUser) {
    return this.activities.createCampaign(dto, user);
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string) {
    return this.activities.getCampaign(id);
  }

  @Get('campaigns/:id/metrics')
  campaignMetrics(@Param('id') id: string) {
    return this.activities.campaignMetrics(id);
  }

  @Patch('campaigns/:id')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.activities.updateCampaign(id, dto);
  }

  // ---- Reports ----
  @Get('reports')
  reports() {
    return this.activities.reportsSummary();
  }

  @Get('reports/export/:type')
  @RequireModule(ModuleKey.Activities, AccessLevel.view)
  async exportReport(@Param('type') type: string, @Res() res: Response) {
    const { filename, csv } = await this.activities.generateCsv(type);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  // ---- Core CRUD ----
  @Get(':id')
  get(@Param('id') id: string) {
    return this.activities.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  create(@Body() dto: CreateActivityDto, @CurrentUser() user: AuthenticatedUser) {
    return this.activities.create(dto, user);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activities.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  remove(@Param('id') id: string) {
    return this.activities.remove(id);
  }

  @Post(':id/status')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeActivityStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activities.changeStatus(id, dto, user);
  }

  @Post(':id/complete')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activities.complete(id, dto, user);
  }

  @Post(':id/notes')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  addNote(
    @Param('id') id: string,
    @Body() dto: AddActivityNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activities.addNote(id, dto, user);
  }

  @Post(':id/participants')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  addParticipant(@Param('id') id: string, @Body() dto: AddParticipantDto) {
    return this.activities.addParticipant(id, dto);
  }

  @Post(':id/reminders')
  @RequireModule(ModuleKey.Activities, AccessLevel.edit)
  addReminder(
    @Param('id') id: string,
    @Body() dto: AddReminderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activities.addReminder(id, dto, user);
  }
}
