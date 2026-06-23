import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionReportsService } from './election-reports.service';
import { CreateReportDto, ReportExportQueryDto } from './dto/election.dto';

@Controller('election/reports')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionReportsController {
  constructor(private readonly service: ElectionReportsService) {}

  @Get('types')
  types() {
    return this.service.listTypes();
  }

  @Get()
  list(@Query('electionId') electionId?: string) {
    return this.service.listReports(electionId);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Get('export/:type')
  export(@Param('type') type: string, @Query() query: ReportExportQueryDto, @Res() res: Response) {
    return this.service.export(type, query).then((result) => {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.body);
    });
  }
}
