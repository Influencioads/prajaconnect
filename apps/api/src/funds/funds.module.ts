import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { FundsController } from './funds.controller';
import { FundsService } from './funds.service';
import { FundsCron } from './funds.cron';

@Module({
  imports: [NotificationsModule],
  controllers: [FundsController],
  providers: [FundsService, FundsCron],
})
export class FundsModule {}
