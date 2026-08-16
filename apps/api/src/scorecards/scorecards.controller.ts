import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ScorecardsService } from './scorecards.service';

@Controller('scorecards')
@RequireModule(ModuleKey.Scorecards, AccessLevel.view)
export class ScorecardsController {
  constructor(private readonly service: ScorecardsService) {}

  /** Manual run — same computation the 05:30 cron performs. */
  @Post('run')
  @RequireModule(ModuleKey.Scorecards, AccessLevel.edit)
  run(@Body() body?: { date?: string }) {
    return this.service.runDaily(body?.date);
  }

  @Get('mandals')
  mandals(@CurrentUser() user: AuthenticatedUser, @Query('date') date?: string) {
    return this.service.listMandals(user, date);
  }

  @Get('mandals/:id/history')
  mandalHistory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.mandalHistory(user, id);
  }

  @Get('leaderboard')
  leaderboard(@CurrentUser() user: AuthenticatedUser, @Query('period') period?: string) {
    return this.service.leaderboard(user, period);
  }

  @Get('cadre/:id/history')
  cadreHistory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.cadreHistory(user, id);
  }
}
