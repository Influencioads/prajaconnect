import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { TempGrievancesService } from './temp-grievances.service';
import { TempGrievancesReportsService } from './temp-grievances-reports.service';
import {
  AddTempGrievanceNoteDto,
  ArchiveTempGrievanceDto,
  AssignValidatorDto,
  ConvertTempGrievanceDto,
  CreateTempGrievanceDto,
  FromCallDto,
  FromD2dSurveyDto,
  FromEmailDto,
  FromFieldVisitDto,
  FromWhatsappDto,
  MarkDuplicateDto,
  MergeTempGrievanceDto,
  RejectTempGrievanceDto,
  RequestMoreInfoDto,
  TempGrievanceQueryDto,
  UpdateTempGrievanceDto,
  ValidateTempGrievanceDto,
} from './dto/temp-grievance.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('temp-grievances')
@RequireModule(ModuleKey.TempGrievances, AccessLevel.view)
export class TempGrievancesController {
  constructor(
    private readonly service: TempGrievancesService,
    private readonly reports: TempGrievancesReportsService,
  ) {}

  @Get()
  list(@Query() query: TempGrievanceQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.list(query, user);
  }

  @Get('analytics')
  analytics() {
    return this.service.analytics();
  }

  @Get('reports/daily')
  dailyReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.dailyReport(from, to);
  }

  @Get('reports/source-wise')
  sourceWiseReport() {
    return this.reports.sourceWiseReport();
  }

  @Get('reports/validator-performance')
  validatorPerformanceReport() {
    return this.reports.validatorPerformanceReport();
  }

  @Get('reports/conversion-rate')
  conversionRateReport() {
    return this.reports.conversionRateReport();
  }

  @Get('reports/duplicate')
  duplicateReport() {
    return this.reports.duplicateReport();
  }

  @Get('reports/rejection')
  rejectionReport() {
    return this.reports.rejectionReport();
  }

  @Get('reports/mandal-wise')
  mandalWiseReport() {
    return this.reports.mandalWiseReport();
  }

  @Get('reports/village-wise')
  villageWiseReport() {
    return this.reports.villageWiseReport();
  }

  @Post('from-call')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  fromCall(@Body() dto: FromCallDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.fromCall(dto, user);
  }

  @Post('from-whatsapp')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  fromWhatsapp(@Body() dto: FromWhatsappDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.fromWhatsapp(dto, user);
  }

  @Post('from-d2d-survey')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  fromD2dSurvey(@Body() dto: FromD2dSurveyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.fromD2dSurvey(dto, user);
  }

  @Post('from-email')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  fromEmail(@Body() dto: FromEmailDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.fromEmail(dto, user);
  }

  @Post('from-field-visit')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  fromFieldVisit(@Body() dto: FromFieldVisitDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.fromFieldVisit(dto, user);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  create(@Body() dto: CreateTempGrievanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Put(':id')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateTempGrievanceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/validate')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  validate(
    @Param('id') id: string,
    @Body() dto: ValidateTempGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.validate(id, dto, user);
  }

  @Post(':id/convert')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  convert(
    @Param('id') id: string,
    @Body() dto: ConvertTempGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.convert(id, dto, user);
  }

  @Post(':id/reject')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectTempGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(id, dto, user);
  }

  @Post(':id/archive')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  archive(
    @Param('id') id: string,
    @Body() dto: ArchiveTempGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.archive(id, dto, user);
  }

  @Post(':id/mark-duplicate')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  markDuplicate(
    @Param('id') id: string,
    @Body() dto: MarkDuplicateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.markDuplicate(id, dto, user);
  }

  @Post(':id/merge')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  merge(
    @Param('id') id: string,
    @Body() dto: MergeTempGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.merge(id, dto, user);
  }

  @Post(':id/request-more-info')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  requestMoreInfo(
    @Param('id') id: string,
    @Body() dto: RequestMoreInfoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.requestMoreInfo(id, dto, user);
  }

  @Post(':id/assign-validator')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  assignValidator(
    @Param('id') id: string,
    @Body() dto: AssignValidatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.assignValidator(id, dto, user);
  }

  @Post(':id/notes')
  @RequireModule(ModuleKey.TempGrievances, AccessLevel.edit)
  addNote(
    @Param('id') id: string,
    @Body() dto: AddTempGrievanceNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.addNote(id, dto, user);
  }

  @Get(':id/duplicates')
  duplicates(@Param('id') id: string) {
    return this.service.getDuplicates(id);
  }
}
