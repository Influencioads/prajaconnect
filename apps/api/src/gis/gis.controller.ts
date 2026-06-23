import { Controller, Get } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { GisService } from './gis.service';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('gis')
@RequireModule(ModuleKey.Gis, AccessLevel.view)
export class GisController {
  constructor(private readonly gis: GisService) {}

  @Get('grievances')
  grievancePoints() {
    return this.gis.grievancePoints();
  }

  @Get('mandals')
  mandalSummary() {
    return this.gis.mandalSummary();
  }
}
