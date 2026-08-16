import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { Public } from '../common/decorators/public.decorator';
import { PublicServiceRequestDto } from './dto/service-request.dto';

/**
 * Unauthenticated citizen surface. Intake reuses the public-portal OTP session
 * (POST /public-portal/auth/otp-request then /otp-verify) — pass the returned
 * sessionId here.
 */
@Controller('public')
export class PublicServiceDeskController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Public()
  @Post('service-requests')
  submit(@Body() dto: PublicServiceRequestDto) {
    return this.service.publicSubmit(dto);
  }

  @Public()
  @Get('service-requests/:refNo')
  track(@Param('refNo') refNo: string) {
    return this.service.publicTrack(refNo);
  }

  @Public()
  @Get('village/:villageId/feed')
  villageFeed(@Param('villageId') villageId: string) {
    return this.service.villageFeed(villageId);
  }
}
