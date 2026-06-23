import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { ElectionTeamsService } from './election-teams.service';
import { CreateTeamDto, TeamMemberDto, TeamQueryDto, UpdateTeamDto } from './dto/election.dto';

@Controller('election/teams')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionTeamsController {
  constructor(private readonly service: ElectionTeamsService) {}

  @Get()
  list(@Query() query: TeamQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateTeamDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/members')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  addMember(@Param('id') id: string, @Body() dto: TeamMemberDto) {
    return this.service.addMember(id, dto);
  }

  @Delete('members/:memberId')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  removeMember(@Param('memberId') memberId: string) {
    return this.service.removeMember(memberId);
  }
}
