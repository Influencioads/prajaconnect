import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { PublicPortalService } from './public-portal.service';
import { Public } from '../common/decorators/public.decorator';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('public-portal')
export class PublicPortalController {
  constructor(private readonly service: PublicPortalService) {}

  @Get('dashboard')
  @RequireModule(ModuleKey.PublicPortal, AccessLevel.view)
  dashboard() {
    return this.service.dashboard();
  }

  @Public()
  @Post('auth/otp-request')
  requestOtp(@Body() body: { mobile: string }) {
    return this.service.requestCitizenOtp(body.mobile);
  }

  @Public()
  @Post('auth/otp-verify')
  verifyOtp(@Body() body: { mobile: string; code: string }) {
    return this.service.verifyCitizenOtp(body.mobile, body.code);
  }

  @Public()
  @Post('grievances')
  submitGrievance(
    @Body()
    body: {
      title: string;
      description: string;
      category?: string;
      reportedByName?: string;
      reportedByMobile?: string;
      villageId?: string;
      mandalId?: string;
    },
  ) {
    return this.service.submitGrievance(body);
  }

  @Get('grievances')
  @RequireModule(ModuleKey.PublicPortal, AccessLevel.view)
  listGrievances(@Query() query: PaginationDto) {
    return this.service.listGrievancesAdmin(query);
  }

  @Public()
  @Get('grievances/:ref')
  trackGrievance(@Param('ref') ref: string) {
    return this.service.trackGrievance(ref);
  }

  @Public()
  @Post('feedback')
  submitFeedback(@Body() body: { name?: string; mobile?: string; message: string }) {
    return this.service.submitFeedback(body);
  }

  @Public()
  @Post('volunteers')
  registerVolunteer(
    @Body() body: { name: string; mobile: string; village?: string },
  ) {
    return this.service.registerVolunteer(body);
  }

  @Public()
  @Post('event-registrations')
  registerEvent(@Body() body: { eventId: string; name: string; mobile: string }) {
    return this.service.registerEvent(body);
  }

  @Public()
  @Get('events')
  listEvents() {
    return this.service.listPublicEvents();
  }

  @Public()
  @Get('schemes/eligibility-check')
  eligibilityCheck(
    @Query('age') age?: string,
    @Query('income') income?: string,
    @Query('occupation') occupation?: string,
    @Query('hasSchoolChild') hasSchoolChild?: string,
    @Query('ownsHouse') ownsHouse?: string,
  ) {
    return this.service.checkSchemeEligibility({
      age: age ? parseInt(age, 10) : undefined,
      income: income ? parseInt(income, 10) : undefined,
      occupation,
      hasSchoolChild: hasSchoolChild === 'true',
      ownsHouse: ownsHouse === 'true',
    });
  }

  @Patch('volunteers/:id/approve')
  @RequireModule(ModuleKey.PublicPortal, AccessLevel.edit)
  approveVolunteer(@Param('id') id: string) {
    return this.service.updateVolunteerStatus(id, 'Approved');
  }

  @Patch('volunteers/:id/reject')
  @RequireModule(ModuleKey.PublicPortal, AccessLevel.edit)
  rejectVolunteer(@Param('id') id: string) {
    return this.service.updateVolunteerStatus(id, 'Rejected');
  }

  @Get('feedback')
  @RequireModule(ModuleKey.PublicPortal, AccessLevel.view)
  listFeedback(@Query() query: PaginationDto) {
    return this.service.listFeedback(query);
  }

  @Get('volunteers')
  @RequireModule(ModuleKey.PublicPortal, AccessLevel.view)
  listVolunteers(@Query() query: PaginationDto) {
    return this.service.listVolunteers(query);
  }
}
