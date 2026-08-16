import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core/ai-core.module';
import { WarRoomModule } from '../war-room/war-room.module';
import { IntelController } from './intel.controller';
import { IntelD2dService } from './intel-d2d.service';
import { IntelBriefService } from './intel-brief.service';
import { IntelBoothService } from './intel-booth.service';

@Module({
  imports: [AiCoreModule, WarRoomModule],
  controllers: [IntelController],
  providers: [IntelD2dService, IntelBriefService, IntelBoothService],
})
export class IntelModule {}
