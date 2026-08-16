import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { IntelD2dService } from './intel-d2d.service';
import { IntelBriefService } from './intel-brief.service';
import { IntelBoothService } from './intel-booth.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

const toInt = (v: string | undefined, fallback: number) => {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

@Controller('intel')
@RequireModule(ModuleKey.Intel, AccessLevel.view)
export class IntelController {
  constructor(
    private readonly d2d: IntelD2dService,
    private readonly briefs: IntelBriefService,
    private readonly booths: IntelBoothService,
  ) {}

  @Get('d2d/latest')
  latestInsight(@Query('scope') scope?: string) {
    return this.d2d.latest(scope);
  }

  @Post('d2d/run')
  @RequireModule(ModuleKey.Intel, AccessLevel.edit)
  runMining(@Body() body: { days?: number }, @CurrentUser() user: AuthenticatedUser) {
    return this.d2d.run(Number(body?.days) > 0 ? Number(body.days) : 7, user);
  }

  @Get('citizen/:id/brief')
  citizenBrief(@Param('id') id: string, @Query('refresh') refresh?: string) {
    return this.briefs.brief(id, refresh === 'true');
  }

  @Get('visitor-prep/today')
  visitorPrep() {
    return this.briefs.visitorPrepToday();
  }

  @Get('booths/priority')
  boothPriority(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return this.booths.priority(user, toInt(limit, 20));
  }

  @Post('booths/:id/explain')
  explainBooth(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.booths.explain(id, user);
  }
}
