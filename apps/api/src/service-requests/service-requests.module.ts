import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { GrievancesModule } from '../grievances/grievances.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ServiceRequestsController } from './service-requests.controller';
import { PublicServiceDeskController } from './public-service-desk.controller';
import { ServiceRequestsService } from './service-requests.service';
import { VolunteersService } from './volunteers.service';

@Module({
  imports: [ActivitiesModule, GrievancesModule, NotificationsModule],
  controllers: [ServiceRequestsController, PublicServiceDeskController],
  providers: [ServiceRequestsService, VolunteersService],
  exports: [ServiceRequestsService, VolunteersService],
})
export class ServiceRequestsModule {}
