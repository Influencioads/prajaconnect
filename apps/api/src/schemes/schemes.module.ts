import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchemesService } from './schemes.service';
import { SchemesController } from './schemes.controller';
import { SchemeMatcherService } from './scheme-matcher.service';
import { SchemeMatcherCron } from './scheme-matcher.cron';

@Module({
  imports: [NotificationsModule],
  controllers: [SchemesController],
  providers: [SchemesService, SchemeMatcherService, SchemeMatcherCron],
})
export class SchemesModule {}
