import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { BrandingService } from './branding.service';

@Controller('branding')
export class BrandingController {
  constructor(private readonly service: BrandingService) {}

  // Public so the login screen and all clients can theme before authenticating.
  @Public()
  @Get()
  getBranding() {
    return this.service.getBranding();
  }
}
