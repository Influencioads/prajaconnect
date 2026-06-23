import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { AttendanceService } from './attendance.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('attendance')
@RequireModule(ModuleKey.Attendance, AccessLevel.view)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('aggregates/mandals')
  aggregateMandals(@Query() query: PaginationDto) {
    return this.service.listAggregateMandals(query);
  }

  @Get('aggregates/booths')
  aggregateBooths(@Query() query: PaginationDto) {
    return this.service.listAggregateBooths(query);
  }

  @Get('records')
  listRecords(@Query() query: PaginationDto, @Query('cadreId') cadreId?: string) {
    return this.service.listRecords(query, cadreId);
  }

  @Get('records/:id')
  getRecord(@Param('id') id: string) {
    return this.service.getRecord(id);
  }

  @Post('check-in')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  checkIn(
    @Body() body: { cadreId: string; latitude?: number; longitude?: number; notes?: string },
  ) {
    return this.service.checkIn(body);
  }

  @Patch('records/:id/check-out')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  checkOut(
    @Param('id') id: string,
    @Body() body: { latitude?: number; longitude?: number; notes?: string },
  ) {
    return this.service.checkOut(id, body);
  }

  @Get('corrections')
  listCorrections(@Query() query: PaginationDto, @Query('status') status?: string) {
    return this.service.listCorrections(query, status);
  }

  @Post('corrections')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  createCorrection(@Body() body: { attendanceId: string; reason: string }) {
    return this.service.createCorrection(body);
  }

  @Patch('corrections/:id/approve')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  approveCorrection(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reviewCorrection(id, true, user.id);
  }

  @Patch('corrections/:id/reject')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  rejectCorrection(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.rejectCorrection(id, user.id);
  }

  @Get('field-reports')
  listFieldReports(@Query() query: PaginationDto, @Query('cadreId') cadreId?: string) {
    return this.service.listFieldReports(query, cadreId);
  }

  @Post('field-reports')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  createFieldReport(
    @Body() body: { cadreId: string; summary: string; tasksCompleted?: number; reportDate?: string },
  ) {
    return this.service.createFieldReport(body);
  }

  @Patch('field-reports/:id')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  updateFieldReport(
    @Param('id') id: string,
    @Body() body: { summary?: string; tasksCompleted?: number },
  ) {
    return this.service.updateFieldReport(id, body);
  }

  @Get('geo-zones')
  listGeoZones(@Query() query: PaginationDto, @Query('mandalId') mandalId?: string) {
    return this.service.listGeoZones(query, mandalId);
  }

  @Get('geo-zones/:id')
  getGeoZone(@Param('id') id: string) {
    return this.service.getGeoZone(id);
  }

  @Post('geo-zones')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  createGeoZone(
    @Body() body: { name: string; latitude: number; longitude: number; radiusM?: number; mandalId?: string },
  ) {
    return this.service.createGeoZone(body);
  }

  @Patch('geo-zones/:id')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  updateGeoZone(
    @Param('id') id: string,
    @Body() body: { name?: string; latitude?: number; longitude?: number; radiusM?: number; mandalId?: string },
  ) {
    return this.service.updateGeoZone(id, body);
  }

  @Delete('geo-zones/:id')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  deleteGeoZone(@Param('id') id: string) {
    return this.service.deleteGeoZone(id);
  }

  @Post('route-points')
  @RequireModule(ModuleKey.Attendance, AccessLevel.edit)
  batchRoutePoints(
    @Body() body: { cadreId: string; points: { latitude: number; longitude: number; recordedAt?: string }[] },
  ) {
    return this.service.batchRoutePoints(body);
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="attendance.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
