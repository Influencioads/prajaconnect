import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { ActivityStatus } from '@praja/database';
import { LeaderOfficeService } from './leader-office.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import {
  AppointmentCalendarQueryDto,
  AppointmentQueryDto,
  CreateAppointmentDto,
  CreateScheduleBlockDto,
  ScheduleQueryDto,
  UpdateAppointmentDto,
  UpdateScheduleBlockDto,
} from './dto/leader-office.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('leader-office')
@RequireModule(ModuleKey.LeaderOffice, AccessLevel.view)
export class LeaderOfficeController {
  constructor(private readonly service: LeaderOfficeService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('calendar')
  calendar(@Query() query: AppointmentCalendarQueryDto) {
    return this.service.calendar(query);
  }

  @Get('appointments')
  listAppointments(@Query() query: AppointmentQueryDto) {
    const { status, ...pagination } = query;
    return this.service.listAppointments(pagination, status);
  }

  @Get('appointments/:id')
  getAppointment(@Param('id') id: string) {
    return this.service.getAppointment(id);
  }

  @Post('appointments')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  createAppointment(@Body() body: CreateAppointmentDto) {
    return this.service.createAppointment(body);
  }

  @Patch('appointments/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  updateAppointment(@Param('id') id: string, @Body() body: UpdateAppointmentDto) {
    return this.service.updateAppointment(id, body);
  }

  @Delete('appointments/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  deleteAppointment(@Param('id') id: string) {
    return this.service.deleteAppointment(id);
  }

  @Get('visitors')
  listVisitors(@Query() query: PaginationDto) {
    return this.service.listVisitors(query);
  }

  @Get('visitors/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="visitors.csv"')
  exportVisitors() {
    return this.service.exportVisitorsCsv();
  }

  @Post('visitors')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  checkInVisitor(@Body() body: { name: string; mobile?: string; purpose?: string }) {
    return this.service.checkInVisitor(body);
  }

  @Patch('visitors/:id/checkout')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  checkOutVisitor(@Param('id') id: string) {
    return this.service.checkOutVisitor(id);
  }

  @Get('schedule')
  listSchedule(@Query() query: ScheduleQueryDto) {
    return this.service.listSchedule(query);
  }

  @Post('schedule')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  createSchedule(@Body() body: CreateScheduleBlockDto) {
    return this.service.createScheduleBlock(body);
  }

  @Patch('schedule/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  updateSchedule(@Param('id') id: string, @Body() body: UpdateScheduleBlockDto) {
    return this.service.updateScheduleBlock(id, body);
  }

  @Delete('schedule/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  deleteSchedule(@Param('id') id: string) {
    return this.service.deleteScheduleBlock(id);
  }

  @Get('vip')
  listVip(@Query() query: PaginationDto) {
    return this.service.listVipContacts(query);
  }

  @Post('vip')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  createVip(@Body() body: { name: string; mobile?: string; organization?: string; notes?: string }) {
    return this.service.createVipContact(body);
  }

  @Patch('vip/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  updateVip(
    @Param('id') id: string,
    @Body() body: { name?: string; mobile?: string; organization?: string; notes?: string },
  ) {
    return this.service.updateVipContact(id, body);
  }

  @Delete('vip/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  deleteVip(@Param('id') id: string) {
    return this.service.deleteVipContact(id);
  }

  @Get('tasks')
  listTasks(@Query() query: PaginationDto) {
    return this.service.listTasks(query);
  }

  @Post('tasks')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  createTask(@Body() body: { title: string; dueDate?: string; status?: ActivityStatus }) {
    return this.service.createTask(body);
  }

  @Patch('tasks/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  updateTask(
    @Param('id') id: string,
    @Body() body: { title?: string; dueDate?: string; status?: ActivityStatus },
  ) {
    return this.service.updateTask(id, body);
  }

  @Delete('tasks/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  deleteTask(@Param('id') id: string) {
    return this.service.deleteTask(id);
  }

  @Get('notes')
  listNotes(@Query() query: PaginationDto) {
    return this.service.listNotes(query);
  }

  @Post('notes')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  createNote(@Body() body: { title: string; content: string; meetingDate?: string }) {
    return this.service.createNote(body);
  }

  @Patch('notes/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  updateNote(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; meetingDate?: string },
  ) {
    return this.service.updateNote(id, body);
  }

  @Delete('notes/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  deleteNote(@Param('id') id: string) {
    return this.service.deleteNote(id);
  }

  @Get('staff')
  listStaff() {
    return this.service.listStaffAssignments();
  }

  @Post('staff')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  createStaff(@Body() body: { userId: string; role?: string }) {
    return this.service.createStaffAssignment(body);
  }

  @Patch('staff/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  updateStaff(@Param('id') id: string, @Body() body: { role?: string }) {
    return this.service.updateStaffAssignment(id, body);
  }

  @Delete('staff/:id')
  @RequireModule(ModuleKey.LeaderOffice, AccessLevel.edit)
  deleteStaff(@Param('id') id: string) {
    return this.service.deleteStaffAssignment(id);
  }
}
