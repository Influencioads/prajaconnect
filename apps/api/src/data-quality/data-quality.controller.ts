import { Body, Controller, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { DataQualityService } from './data-quality.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('data-quality')
@RequireModule(ModuleKey.DataQuality, AccessLevel.view)
export class DataQualityController {
  constructor(private readonly service: DataQualityService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('issues')
  listIssues(@Query() query: PaginationDto, @Query('resolved') resolved?: string) {
    return this.service.listIssues(
      query,
      resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    );
  }

  @Patch('issues/:id/resolve')
  @RequireModule(ModuleKey.DataQuality, AccessLevel.edit)
  resolveIssue(@Param('id') id: string) {
    return this.service.resolveIssue(id);
  }

  @Get('merge-suggestions')
  listMergeSuggestions(@Query() query: PaginationDto, @Query('status') status?: string) {
    return this.service.listMergeSuggestions(query, status);
  }

  @Patch('merge-suggestions/:id')
  @RequireModule(ModuleKey.DataQuality, AccessLevel.edit)
  reviewMergeSuggestion(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reviewMergeSuggestion(id, body.status, user.id);
  }

  @Post('merge-suggestions/:id/execute')
  @RequireModule(ModuleKey.DataQuality, AccessLevel.edit)
  executeMerge(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.executeMerge(id, user.id);
  }

  @Post('detect/citizens')
  @RequireModule(ModuleKey.DataQuality, AccessLevel.edit)
  detectCitizens() {
    return this.service.detectCitizenDuplicates();
  }

  @Post('detect/grievances')
  @RequireModule(ModuleKey.DataQuality, AccessLevel.edit)
  detectGrievances() {
    return this.service.detectGrievanceDuplicates();
  }

  @Get('check-citizen-duplicate')
  checkCitizenDuplicate(@Query('mobile') mobile?: string, @Query('name') name?: string) {
    return this.service.checkCitizenDuplicate(mobile, name);
  }

  @Post('normalize/address')
  @RequireModule(ModuleKey.DataQuality, AccessLevel.edit)
  normalizeAddress(@Body() body: { citizenId: string; address: string }) {
    return this.service.normalizeAddress(body);
  }

  @Post('validate/mobile')
  validateMobile(@Body() body: { mobile: string; citizenId?: string }) {
    return this.service.validateMobile(body);
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="data-quality.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
