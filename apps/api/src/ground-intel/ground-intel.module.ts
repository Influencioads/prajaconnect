import { Module } from '@nestjs/common';
import { GroundIntelController } from './ground-intel.controller';
import { GroundIntelService } from './ground-intel.service';

@Module({
  controllers: [GroundIntelController],
  providers: [GroundIntelService],
  exports: [GroundIntelService],
})
export class GroundIntelModule {}
