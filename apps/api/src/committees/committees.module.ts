import { Module } from '@nestjs/common';
import { CommitteesController } from './committees.controller';
import { CommitteesService } from './committees.service';
import { CommitteeMembersController } from './committee-members.controller';
import { CommitteeMembersService } from './committee-members.service';
import { ObserversController } from './observers.controller';
import { ObserversService } from './observers.service';
import { ImpLeadersController } from './imp-leaders.controller';
import { ImpLeadersService } from './imp-leaders.service';
import { InfluencersController } from './influencers.controller';
import { InfluencersService } from './influencers.service';
import { PressController } from './press.controller';
import { PressService } from './press.service';
import { CommitteeAnalyticsController } from './committee-analytics.controller';
import { CommitteeAnalyticsService } from './committee-analytics.service';

@Module({
  controllers: [
    CommitteesController,
    CommitteeMembersController,
    ObserversController,
    ImpLeadersController,
    InfluencersController,
    PressController,
    CommitteeAnalyticsController,
  ],
  providers: [
    CommitteesService,
    CommitteeMembersService,
    ObserversService,
    ImpLeadersService,
    InfluencersService,
    PressService,
    CommitteeAnalyticsService,
  ],
})
export class CommitteesModule {}
