import { Module } from '@nestjs/common';
import { GisService } from './gis.service';
import { GisController } from './gis.controller';

@Module({
  controllers: [GisController],
  providers: [GisService],
})
export class GisModule {}
