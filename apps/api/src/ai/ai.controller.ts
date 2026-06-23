import { Controller, Get } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { AiService } from './ai.service';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('ai')
@RequireModule(ModuleKey.Ai, AccessLevel.view)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('overview')
  overview() {
    return this.ai.overview();
  }

  @Get('health')
  health() {
    return this.ai.constituencyHealth();
  }

  @Get('readiness')
  readiness() {
    return this.ai.electionReadiness();
  }

  @Get('sentiment')
  sentiment() {
    return this.ai.publicSentiment();
  }

  @Get('alerts')
  alerts() {
    return this.ai.riskAlerts();
  }

  @Get('briefing')
  briefing() {
    return this.ai.dailyBriefing();
  }
}
