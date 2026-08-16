import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { LeaderOfficeController } from './leader-office.controller';
import { LeaderOfficeService } from './leader-office.service';
import { ProtocolController } from './protocol.controller';
import { ProtocolService } from './protocol.service';

@Module({
  imports: [NotificationsModule],
  controllers: [LeaderOfficeController, ProtocolController],
  providers: [LeaderOfficeService, ProtocolService],
  exports: [LeaderOfficeService],
})
export class LeaderOfficeModule {}
