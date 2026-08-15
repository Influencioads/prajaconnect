import { Controller, Get, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { OpsAlertsService } from './ops-alerts.service';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('ops-alerts')
@RequireModule(ModuleKey.OpsAlerts, AccessLevel.view)
export class OpsAlertsController {
  constructor(private readonly service: OpsAlertsService) {}

  @Get('sla')
  sla() {
    return this.service.slaOverview();
  }

  @Get('inactive-cadre')
  inactiveCadre(@Query('days') days?: string) {
    const n = days ? parseInt(days, 10) : undefined;
    return this.service.inactiveCadre(Number.isFinite(n) ? n : undefined);
  }

  @Get('dark-zones')
  darkZones() {
    return this.service.darkZones();
  }

  @Get('snapshot/latest')
  latestSnapshot() {
    return this.service.latestSnapshot();
  }

  @Post('run')
  @RequireModule(ModuleKey.OpsAlerts, AccessLevel.edit)
  runNow() {
    return this.service.runDailyScan();
  }
}
