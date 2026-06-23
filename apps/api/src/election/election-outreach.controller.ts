import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionOutreachService } from './election-outreach.service';
import { CreateOutreachDto, OutreachQueryDto, UpdateOutreachDto } from './dto/election.dto';

@Controller('election/voter-outreach')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionOutreachController {
  constructor(private readonly service: ElectionOutreachService) {}

  @Get('stats')
  stats(@Query() query: OutreachQueryDto) {
    return this.service.stats(query);
  }

  @Get()
  list(@Query() query: OutreachQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateOutreachDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateOutreachDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
