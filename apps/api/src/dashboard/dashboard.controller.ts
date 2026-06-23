import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { DashboardService } from './dashboard.service';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('dashboard')
@RequireModule(ModuleKey.Dashboard, AccessLevel.view)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async full(@Res({ passthrough: true }) res: Response) {
    const { data, serverTiming } = await this.dashboardService.full();
    // Surfaces per-section timings (and cache hit/miss) in the browser Network tab.
    res.setHeader('Server-Timing', serverTiming);
    return data;
  }

  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }
}
