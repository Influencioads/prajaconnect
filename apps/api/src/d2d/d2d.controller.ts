import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, D2DSurveyStatus, ModuleKey } from '@praja/types';
import { D2dService } from './d2d.service';
import { D2dAnalyticsService } from './d2d-analytics.service';
import { D2dReportsService, D2DReportType } from './d2d-reports.service';
import { D2dSyncService } from './d2d-sync.service';
import {
  AssignSurveyDto,
  CreateD2DResponseDto,
  CreateD2DSurveyDto,
  CreateFollowupDto,
  ConvertCitizenDto,
  ConvertGrievanceDto,
  D2DAnalyticsQueryDto,
  D2DAssignmentQueryDto,
  D2DReportQueryDto,
  D2DResponseQueryDto,
  D2DSurveyQueryDto,
  D2DSyncBatchDto,
  SaveQuestionsDto,
  UpdateD2DSurveyDto,
} from './dto/d2d.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('d2d-surveys')
@RequireModule(ModuleKey.D2D, AccessLevel.view)
export class D2dSurveysController {
  constructor(private readonly d2d: D2dService) {}

  @Get()
  list(@Query() query: D2DSurveyQueryDto) {
    return this.d2d.listSurveys(query);
  }

  @Get('stats')
  stats() {
    return this.d2d.surveyStats();
  }

  @Get('my-assignments')
  myAssignments(@CurrentUser() user: AuthenticatedUser) {
    return this.d2d.myAssignments(user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.d2d.getSurvey(id);
  }

  @Post()
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  create(@Body() dto: CreateD2DSurveyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.d2d.createSurvey(dto, user);
  }

  @Put(':id')
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateD2DSurveyDto) {
    return this.d2d.updateSurvey(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.D2D, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.d2d.deleteSurvey(id);
  }

  @Post(':id/questions')
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  saveQuestions(@Param('id') id: string, @Body() dto: SaveQuestionsDto) {
    return this.d2d.saveQuestions(id, dto);
  }

  @Post(':id/assign')
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  assign(@Param('id') id: string, @Body() dto: AssignSurveyDto) {
    return this.d2d.assignSurvey(id, dto);
  }

  @Patch(':id/status')
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  updateStatus(@Param('id') id: string, @Body('status') status: D2DSurveyStatus) {
    return this.d2d.updateSurveyStatus(id, status);
  }
}

@Controller('d2d-assignments')
@RequireModule(ModuleKey.D2D, AccessLevel.view)
export class D2dAssignmentsController {
  constructor(private readonly d2d: D2dService) {}

  @Get()
  list(@Query() query: D2DAssignmentQueryDto) {
    return this.d2d.listAssignments(query);
  }
}

@Controller('d2d-responses')
@RequireModule(ModuleKey.D2D, AccessLevel.view)
export class D2dResponsesController {
  constructor(private readonly d2d: D2dService) {}

  @Get()
  list(@Query() query: D2DResponseQueryDto) {
    return this.d2d.listResponses(query);
  }

  @Get('households')
  households(@Query() query: D2DResponseQueryDto) {
    return this.d2d.listHouseholds(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.d2d.getResponse(id);
  }

  @Post()
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  create(@Body() dto: CreateD2DResponseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.d2d.createResponse(dto, user);
  }

  @Post(':id/convert-grievance')
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  convertGrievance(
    @Param('id') id: string,
    @Body() dto: ConvertGrievanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.d2d.convertToGrievance(id, dto, user);
  }

  @Post(':id/convert-citizen')
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  convertCitizen(@Param('id') id: string, @Body() dto: ConvertCitizenDto) {
    return this.d2d.convertToCitizen(id, dto);
  }

  @Post(':id/followup')
  @RequireModule(ModuleKey.D2D, AccessLevel.edit)
  followup(
    @Param('id') id: string,
    @Body() dto: CreateFollowupDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.d2d.createFollowup(id, dto, user);
  }
}

@Controller('d2d-analytics')
@RequireModule(ModuleKey.D2D, AccessLevel.view)
export class D2dAnalyticsController {
  constructor(private readonly analytics: D2dAnalyticsService) {}

  @Get()
  overview(@Query() query: D2DAnalyticsQueryDto) {
    return this.analytics.overview(query);
  }
}

@Controller('d2d-reports')
@RequireModule(ModuleKey.D2D, AccessLevel.view)
export class D2dReportsController {
  constructor(private readonly reports: D2dReportsService) {}

  @Get()
  list() {
    return this.reports.list();
  }

  @Get('export/:type')
  export(
    @Param('type') type: D2DReportType,
    @Query() query: D2DReportQueryDto,
    @Query('format') format: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    return this.reports.generate(type, query, user.id).then((result) => {
      if (format === 'json') {
        return res.json(result);
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.csv);
    });
  }
}

@Controller('d2d-sync')
@RequireModule(ModuleKey.D2D, AccessLevel.edit)
export class D2dSyncController {
  constructor(private readonly syncService: D2dSyncService) {}

  @Post()
  syncBatch(@Body() dto: D2DSyncBatchDto, @CurrentUser() user: AuthenticatedUser) {
    return this.syncService.syncBatch(dto, user);
  }

  @Get('pending')
  pending(@Query('deviceId') deviceId: string) {
    return this.syncService.pendingCount(deviceId);
  }
}
