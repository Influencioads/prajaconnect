import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SocialService } from './social.service';

@Injectable()
export class SocialCron {
  private readonly logger = new Logger(SocialCron.name);

  constructor(private readonly social: SocialService) {}

  /** Every 5 minutes: mark due Approved posts as Posted (simulated publish). */
  @Cron('*/5 * * * *')
  async publishDuePosts() {
    try {
      if (!(await this.social.isCronEnabled())) return;
      const result = await this.social.processDuePosts();
      if (result.posted > 0) {
        this.logger.log(`[social] scheduler cycle posted ${result.posted} post(s)`);
      }
    } catch (err) {
      this.logger.error('Social scheduler cycle failed', err as Error);
    }
  }
}
