import { Controller, Get } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CommitteeAnalyticsService } from './committee-analytics.service';

@Controller('committee-analytics')
@RequireModule(ModuleKey.Committees, AccessLevel.view)
export class CommitteeAnalyticsController {
  constructor(private readonly analytics: CommitteeAnalyticsService) {}

  @Get()
  overview() {
    return this.analytics.overview();
  }
}
