import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionSettingsService } from './election-reports.service';
import { CreateElectionDto, ElectionQueryDto, UpdateElectionDto } from './dto/election.dto';

@Controller('election')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionSettingsController {
  constructor(private readonly service: ElectionSettingsService) {}

  @Get('active')
  active() {
    return this.service.getActive();
  }

  @Get('settings')
  list(@Query() query: ElectionQueryDto) {
    return this.service.list(query);
  }

  @Get('settings/:id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post('settings')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  create(@Body() dto: CreateElectionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Patch('settings/:id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  update(@Param('id') id: string, @Body() dto: UpdateElectionDto) {
    return this.service.update(id, dto);
  }

  @Delete('settings/:id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
