import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NetworkBaseController } from './network-base.controller';
import { NetworkBaseService } from './network-base.service';
import { ImpLeadersService } from './imp-leaders.service';
import { CreateImpLeaderDto, UpdateImpLeaderDto } from './dto/network.dto';

@Controller('imp-leaders')
@RequireModule(ModuleKey.Committees, AccessLevel.view)
export class ImpLeadersController extends NetworkBaseController {
  constructor(private readonly impLeaders: ImpLeadersService) {
    super();
  }

  protected get service(): NetworkBaseService {
    return this.impLeaders;
  }

  @Post()
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  create(@Body() dto: CreateImpLeaderDto, @CurrentUser('id') userId: string) {
    return this.impLeaders.create({ ...dto }, userId);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateImpLeaderDto, @CurrentUser('id') userId: string) {
    return this.impLeaders.update(id, { ...dto }, userId);
  }
}
