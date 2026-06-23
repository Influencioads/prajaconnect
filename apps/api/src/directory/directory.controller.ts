import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { DirectoryService } from './directory.service';
import {
  CreateDepartmentDto,
  CreateOfficialDto,
  OfficialQueryDto,
  UpdateDepartmentDto,
  UpdateOfficialDto,
} from './dto/directory.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller()
@RequireModule(ModuleKey.Officials, AccessLevel.view)
export class DirectoryController {
  constructor(private readonly directory: DirectoryService) {}

  @Get('departments')
  listDepartments() {
    return this.directory.listDepartments();
  }

  @Post('departments')
  @RequireModule(ModuleKey.Officials, AccessLevel.edit)
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.directory.createDepartment(dto);
  }

  @Patch('departments/:id')
  @RequireModule(ModuleKey.Officials, AccessLevel.edit)
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.directory.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @RequireModule(ModuleKey.Officials, AccessLevel.full)
  removeDepartment(@Param('id') id: string) {
    return this.directory.removeDepartment(id);
  }

  @Get('officials')
  listOfficials(@Query() query: OfficialQueryDto) {
    return this.directory.listOfficials(query);
  }

  @Get('officials/escalation')
  escalation() {
    return this.directory.escalationMatrix();
  }

  @Post('officials')
  @RequireModule(ModuleKey.Officials, AccessLevel.edit)
  createOfficial(@Body() dto: CreateOfficialDto) {
    return this.directory.createOfficial(dto);
  }

  @Patch('officials/:id')
  @RequireModule(ModuleKey.Officials, AccessLevel.edit)
  updateOfficial(@Param('id') id: string, @Body() dto: UpdateOfficialDto) {
    return this.directory.updateOfficial(id, dto);
  }

  @Delete('officials/:id')
  @RequireModule(ModuleKey.Officials, AccessLevel.full)
  removeOfficial(@Param('id') id: string) {
    return this.directory.removeOfficial(id);
  }
}
