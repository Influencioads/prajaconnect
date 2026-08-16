import { Module } from '@nestjs/common';
import { CampsService } from './camps.service';
import { CampsController } from './camps.controller';

@Module({
  controllers: [CampsController],
  providers: [CampsService],
})
export class CampsModule {}
