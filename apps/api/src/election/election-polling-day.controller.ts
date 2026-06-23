import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionPollingDayService } from './election-polling-day.service';
import { CreatePollingUpdateDto, PollingDayQueryDto } from './dto/election.dto';

@Controller('election/polling-day')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionPollingDayController {
  constructor(private readonly service: ElectionPollingDayService) {}

  @Get('live')
  live(@Query() query: PollingDayQueryDto) {
    return this.service.liveDashboard(query);
  }

  @Get()
  list(@Query() query: PollingDayQueryDto) {
    return this.service.listUpdates(query);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreatePollingUpdateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createUpdate(dto, user);
  }

  @Patch(':id/resolve')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  resolve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.resolveIssue(id, user);
  }
}
