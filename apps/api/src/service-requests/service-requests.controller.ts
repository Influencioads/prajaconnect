import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { ServiceRequestsService } from './service-requests.service';
import { VolunteersService } from './volunteers.service';
import {
  AssignVolunteerTaskDto,
  ChangeServiceRequestStatusDto,
  CreateServiceRequestDto,
  ForwardServiceRequestDto,
  LogVolunteerHoursDto,
  ServiceRequestQueryDto,
  UpdateServiceRequestDto,
  UpdateVolunteerProfileDto,
  VolunteerProfileQueryDto,
} from './dto/service-request.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('service-requests')
@RequireModule(ModuleKey.ServiceDesk, AccessLevel.view)
export class ServiceRequestsController {
  constructor(
    private readonly service: ServiceRequestsService,
    private readonly volunteers: VolunteersService,
  ) {}

  @Get()
  list(@Query() query: ServiceRequestQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.list(query, user);
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('options')
  options() {
    return this.service.options();
  }

  // --- volunteers (declared before :id so the queue detail route doesn't swallow them) ---

  @Get('volunteers')
  listVolunteers(@Query() query: VolunteerProfileQueryDto) {
    return this.volunteers.list(query);
  }

  @Get('volunteers/leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    return this.volunteers.leaderboard(limit ? parseInt(limit, 10) : 20);
  }

  @Get('volunteers/:id')
  getVolunteer(@Param('id') id: string) {
    return this.volunteers.get(id);
  }

  @Patch('volunteers/:id')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  updateVolunteer(@Param('id') id: string, @Body() dto: UpdateVolunteerProfileDto) {
    return this.volunteers.update(id, dto);
  }

  @Post('volunteers/:id/assign-task')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  assignTask(
    @Param('id') id: string,
    @Body() dto: AssignVolunteerTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.volunteers.assignTask(id, dto, user);
  }

  @Post('volunteers/:id/log-hours')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  logHours(
    @Param('id') id: string,
    @Body() dto: LogVolunteerHoursDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.volunteers.logHours(id, dto, user);
  }

  @Post('volunteers/:id/refresh-points')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  refreshPoints(@Param('id') id: string) {
    return this.volunteers.refreshPoints(id);
  }

  // --- service requests ---

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  create(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateServiceRequestDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/status')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeServiceRequestStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.changeStatus(id, dto, user);
  }

  @Post(':id/forward')
  @RequireModule(ModuleKey.ServiceDesk, AccessLevel.edit)
  forward(
    @Param('id') id: string,
    @Body() dto: ForwardServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.forward(id, dto, user);
  }
}
