import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CommitteesService } from './committees.service';
import {
  CommitteeQueryDto,
  CreateCommitteeDto,
  UpdateCommitteeDto,
} from './dto/network.dto';

@Controller('committees')
@RequireModule(ModuleKey.Committees, AccessLevel.view)
export class CommitteesController {
  constructor(private readonly committees: CommitteesService) {}

  @Get()
  list(@Query() query: CommitteeQueryDto) {
    return this.committees.list(query);
  }

  @Get('options')
  options() {
    return this.committees.options();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.committees.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  create(@Body() dto: CreateCommitteeDto) {
    return this.committees.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateCommitteeDto) {
    return this.committees.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.committees.remove(id);
  }
}
