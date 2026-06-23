import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NetworkBaseController } from './network-base.controller';
import { NetworkBaseService } from './network-base.service';
import { CommitteeMembersService } from './committee-members.service';
import { CreateCommitteeMemberDto, UpdateCommitteeMemberDto } from './dto/network.dto';

@Controller('committee-members')
@RequireModule(ModuleKey.Committees, AccessLevel.view)
export class CommitteeMembersController extends NetworkBaseController {
  constructor(private readonly members: CommitteeMembersService) {
    super();
  }

  protected get service(): NetworkBaseService {
    return this.members;
  }

  @Post()
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  create(@Body() dto: CreateCommitteeMemberDto, @CurrentUser('id') userId: string) {
    return this.members.create({ ...dto }, userId);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateCommitteeMemberDto, @CurrentUser('id') userId: string) {
    return this.members.update(id, { ...dto }, userId);
  }
}
