import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { FundraisingService } from './fundraising.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CommunicationQueryDto,
  CreateCommunicationDto,
  CreateDonationDto,
  CreateDonorDto,
  CreateEventDto,
  CreateFollowUpDto,
  DonationQueryDto,
  FollowUpQueryDto,
  UpdateCommunicationDto,
  UpdateDonationDto,
  UpdateDonorDto,
  UpdateEventDto,
  UpdateFollowUpDto,
} from './dto/fundraising.dto';

@Controller('fundraising')
@RequireModule(ModuleKey.Fundraising, AccessLevel.view)
export class FundraisingController {
  constructor(private readonly service: FundraisingService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="fundraising.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }

  @Get('donors')
  listDonors(@Query() query: PaginationDto) {
    return this.service.listDonors(query);
  }

  @Get('donors/:id')
  getDonor(@Param('id') id: string) {
    return this.service.getDonor(id);
  }

  @Post('donors')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  createDonor(@Body() body: CreateDonorDto) {
    return this.service.createDonor(body);
  }

  @Patch('donors/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  updateDonor(@Param('id') id: string, @Body() body: UpdateDonorDto) {
    return this.service.updateDonor(id, body);
  }

  @Get('donations')
  listDonations(@Query() query: DonationQueryDto) {
    return this.service.listDonations(query);
  }

  @Get('donations/:id')
  getDonation(@Param('id') id: string) {
    return this.service.getDonation(id);
  }

  @Post('donations')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  createDonation(@Body() body: CreateDonationDto) {
    return this.service.createDonation(body);
  }

  @Patch('donations/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  updateDonation(@Param('id') id: string, @Body() body: UpdateDonationDto) {
    return this.service.updateDonation(id, body);
  }

  @Post('donations/:id/receipt')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  issueReceipt(@Param('id') id: string) {
    return this.service.issueReceipt(id);
  }

  @Get('events')
  listEvents(@Query() query: PaginationDto) {
    return this.service.listEvents(query);
  }

  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    return this.service.getEvent(id);
  }

  @Post('events')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  createEvent(@Body() body: CreateEventDto) {
    return this.service.createEvent(body);
  }

  @Patch('events/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  updateEvent(@Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.service.updateEvent(id, body);
  }

  @Delete('events/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.full)
  removeEvent(@Param('id') id: string) {
    return this.service.removeEvent(id);
  }

  @Get('follow-ups/reminders')
  followUpReminders() {
    return this.service.listFollowUpReminders();
  }

  @Get('follow-ups')
  listFollowUps(@Query() query: FollowUpQueryDto) {
    return this.service.listFollowUps(query);
  }

  @Get('follow-ups/:id')
  getFollowUp(@Param('id') id: string) {
    return this.service.getFollowUp(id);
  }

  @Post('follow-ups')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  createFollowUp(@Body() body: CreateFollowUpDto) {
    return this.service.createFollowUp(body);
  }

  @Patch('follow-ups/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  updateFollowUp(@Param('id') id: string, @Body() body: UpdateFollowUpDto) {
    return this.service.updateFollowUp(id, body);
  }

  @Delete('follow-ups/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.full)
  removeFollowUp(@Param('id') id: string) {
    return this.service.removeFollowUp(id);
  }

  @Get('communications')
  listCommunications(@Query() query: CommunicationQueryDto) {
    return this.service.listCommunications(query);
  }

  @Get('communications/:id')
  getCommunication(@Param('id') id: string) {
    return this.service.getCommunication(id);
  }

  @Post('communications')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  createCommunication(@Body() body: CreateCommunicationDto) {
    return this.service.createCommunication(body);
  }

  @Patch('communications/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.edit)
  updateCommunication(@Param('id') id: string, @Body() body: UpdateCommunicationDto) {
    return this.service.updateCommunication(id, body);
  }

  @Delete('communications/:id')
  @RequireModule(ModuleKey.Fundraising, AccessLevel.full)
  removeCommunication(@Param('id') id: string) {
    return this.service.removeCommunication(id);
  }
}
