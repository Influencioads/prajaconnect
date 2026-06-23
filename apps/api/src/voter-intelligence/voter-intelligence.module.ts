import { Module } from '@nestjs/common';
import { VoterIntelligenceController } from './voter-intelligence.controller';
import { VoterIntelligenceService } from './voter-intelligence.service';

@Module({
  controllers: [VoterIntelligenceController],
  providers: [VoterIntelligenceService],
  exports: [VoterIntelligenceService],
})
export class VoterIntelligenceModule {}
