import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionMaterialsService } from './election-materials.service';
import {
  CreateMaterialDto,
  MaterialDistributionDto,
  MaterialQueryDto,
  MaterialReturnDto,
  UpdateMaterialDto,
} from './dto/election.dto';

@Controller('election/materials')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionMaterialsController {
  constructor(private readonly service: ElectionMaterialsService) {}

  @Get('distributions')
  distributions(@Query() query: MaterialQueryDto) {
    return this.service.listDistributions(query);
  }

  @Get()
  list(@Query() query: MaterialQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateMaterialDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/distribute')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  distribute(@Param('id') id: string, @Body() dto: MaterialDistributionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.distribute(id, dto, user);
  }

  @Post('distributions/:distributionId/return')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  returnStock(@Param('distributionId') distributionId: string, @Body() dto: MaterialReturnDto) {
    return this.service.returnStock(distributionId, dto);
  }
}
