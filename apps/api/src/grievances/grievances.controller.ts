import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { GrievancesService } from './grievances.service';
import { GrievanceSlaService } from './grievance-sla.service';
import {
  AddNoteDto,
  AssignGrievanceDto,
  ChangeStatusDto,
  CreateGrievanceDto,
  FeedbackDto,
  GrievanceQueryDto,
  UpdateGrievanceDto,
} from './dto/grievance.dto';
import { SlaViolationQueryDto } from './dto/grievance-sla.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('grievances')
@RequireModule(ModuleKey.Grievances, AccessLevel.view)
export class GrievancesController {
  constructor(
    private readonly grievancesService: GrievancesService,
    private readonly slaService: GrievanceSlaService,
  ) {}

  @Get()
  list(@Query() query: GrievanceQueryDto) {
    return this.grievancesService.list(query);
  }

  @Get('stats')
  stats() {
    return this.grievancesService.stats();
  }

  @Get('sla-tracker')
  slaTracker() {
    return this.slaService.trackerSummary();
  }

  @Get('sla-violations')
  slaViolations(@Query() query: SlaViolationQueryDto) {
    return this.slaService.listViolations(query);
  }

  @Get('options')
  options() {
    return this.grievancesService.options();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.grievancesService.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Grievances, AccessLevel.edit)
  create(@Body() dto: CreateGrievanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.grievancesService.create(dto, user);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Grievances, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateGrievanceDto) {
    return this.grievancesService.update(id, dto);
  }

  @Post(':id/assign')
  @RequireModule(ModuleKey.Grievances, AccessLevel.edit)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievancesService.assign(id, dto, user);
  }

  @Post(':id/status')
  @RequireModule(ModuleKey.Grievances, AccessLevel.edit)
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievancesService.changeStatus(id, dto, user);
  }

  @Post(':id/notes')
  @RequireModule(ModuleKey.Grievances, AccessLevel.edit)
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievancesService.addNote(id, dto, user);
  }

  @Post(':id/feedback')
  @RequireModule(ModuleKey.Grievances, AccessLevel.edit)
  feedback(
    @Param('id') id: string,
    @Body() dto: FeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.grievancesService.feedback(id, dto, user);
  }
}
