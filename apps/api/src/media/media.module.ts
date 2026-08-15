import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialCron } from './social.cron';

@Module({
  controllers: [MediaController, SocialController],
  providers: [MediaService, SocialService, SocialCron],
  exports: [MediaService],
})
export class MediaModule {}
