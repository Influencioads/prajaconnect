import { Module } from '@nestjs/common';
import { ScorecardsController } from './scorecards.controller';
import { ScorecardsService } from './scorecards.service';
import { ScorecardsCron } from './scorecards.cron';

@Module({
  controllers: [ScorecardsController],
  providers: [ScorecardsService, ScorecardsCron],
  exports: [ScorecardsService],
})
export class ScorecardsModule {}
