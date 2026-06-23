import { Module } from '@nestjs/common';
import { LeaderOfficeController } from './leader-office.controller';
import { LeaderOfficeService } from './leader-office.service';

@Module({
  controllers: [LeaderOfficeController],
  providers: [LeaderOfficeService],
  exports: [LeaderOfficeService],
})
export class LeaderOfficeModule {}
