import { Controller, Get, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { ElectionDashboardService } from './election-dashboard.service';
import { ElectionScopeDto } from './dto/election.dto';

@Controller('election/dashboard')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionDashboardController {
  constructor(private readonly service: ElectionDashboardService) {}

  @Get()
  get(@Query() query: ElectionScopeDto) {
    return this.service.getDashboard(query);
  }
}
