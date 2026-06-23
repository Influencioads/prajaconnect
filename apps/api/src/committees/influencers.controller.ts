import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NetworkBaseController } from './network-base.controller';
import { NetworkBaseService } from './network-base.service';
import { InfluencersService } from './influencers.service';
import { CreateInfluencerDto, UpdateInfluencerDto } from './dto/network.dto';

@Controller('influencers')
@RequireModule(ModuleKey.Committees, AccessLevel.view)
export class InfluencersController extends NetworkBaseController {
  constructor(private readonly influencers: InfluencersService) {
    super();
  }

  protected get service(): NetworkBaseService {
    return this.influencers;
  }

  @Post()
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  create(@Body() dto: CreateInfluencerDto, @CurrentUser('id') userId: string) {
    return this.influencers.create({ ...dto }, userId);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateInfluencerDto, @CurrentUser('id') userId: string) {
    return this.influencers.update(id, { ...dto }, userId);
  }
}
