import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { AdminService } from './admin.service';
import {
  AdminUserQueryDto,
  CreateRoleDto,
  CreateUserDto,
  ResetPasswordDto,
  UpdateRoleDto,
  UpdateUserDto,
  UpdateSettingsDto,
} from './dto/admin.dto';

@Controller('admin')
@RequireModule(ModuleKey.Admin, AccessLevel.view)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  // ===== Settings =====
  @Get('settings')
  listSettings() {
    return this.service.listSettings();
  }

  @Patch('settings')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.service.updateSettings(dto);
  }

  // ===== Users =====
  @Get('users')
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.service.listUsers(query);
  }

  @Post('users')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createUser(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }

  @Patch('users/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.updateUser(id, dto);
  }

  @Post('users/:id/reset-password')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(id, dto);
  }

  @Delete('users/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  deactivateUser(@Param('id') id: string) {
    return this.service.deactivateUser(id);
  }

  // ===== Roles & permissions =====
  @Get('permissions')
  listPermissions() {
    return this.service.listPermissions();
  }

  @Get('roles')
  listRoles() {
    return this.service.listRoles();
  }

  @Post('roles')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createRole(@Body() dto: CreateRoleDto) {
    return this.service.createRole(dto);
  }

  @Patch('roles/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.service.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.full)
  deleteRole(@Param('id') id: string) {
    return this.service.deleteRole(id);
  }
}
