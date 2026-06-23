import { Module } from '@nestjs/common';
import { CallCenterController } from './call-center.controller';
import { CallCenterService } from './call-center.service';
import { TempGrievancesModule } from '../temp-grievances/temp-grievances.module';

@Module({
  imports: [TempGrievancesModule],
  controllers: [CallCenterController],
  providers: [CallCenterService],
  exports: [CallCenterService],
})
export class CallCenterModule {}
