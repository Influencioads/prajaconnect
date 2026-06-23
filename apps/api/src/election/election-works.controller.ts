import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionWorksService } from './election-works.service';
import { AssignWorkDto, CreateWorkDto, UpdateWorkDto, WorkQueryDto } from './dto/election.dto';

@Controller('election/works')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionWorksController {
  constructor(private readonly service: ElectionWorksService) {}

  @Get()
  list(@Query() query: WorkQueryDto) {
    return this.service.list(query);
  }

  @Get('my')
  myWorks(@Query() query: WorkQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.myWorks(undefined, user, query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateWorkDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateWorkDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/assign')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  assign(@Param('id') id: string, @Body() dto: AssignWorkDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.assign(id, dto, user);
  }
}
