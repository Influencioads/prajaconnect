import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { ElectionBoothsService } from './election-booths.service';
import {
  BoothQueryDto,
  CreateBoothPlanDto,
  PollingAgentDto,
  UpdateBoothPlanDto,
} from './dto/election.dto';

@Controller('election/booths')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionBoothsController {
  constructor(private readonly service: ElectionBoothsService) {}

  @Get()
  list(@Query() query: BoothQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateBoothPlanDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateBoothPlanDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/agents')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  addAgent(@Param('id') id: string, @Body() dto: PollingAgentDto) {
    return this.service.addAgent(id, dto);
  }

  @Delete('agents/:agentId')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  removeAgent(@Param('agentId') agentId: string) {
    return this.service.removeAgent(agentId);
  }
}
