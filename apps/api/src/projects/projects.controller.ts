import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './dto/project.dto';
import { CreateProgressDto } from './dto/progress.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { UploadsService, type MemoryFile } from '../uploads/uploads.service';

const MAX_BYTES = 10 * 1024 * 1024;

@Controller('projects')
@RequireModule(ModuleKey.DevProjects, AccessLevel.view)
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly uploads: UploadsService,
  ) {}

  @Get()
  list(@Query() query: ProjectQueryDto) {
    return this.projects.list(query);
  }

  @Get('stats')
  stats() {
    return this.projects.stats();
  }

  @Get('progress-map')
  progressMap() {
    return this.projects.progressMap();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.projects.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.DevProjects, AccessLevel.edit)
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.DevProjects, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Get(':id/progress')
  listProgress(@Param('id') id: string) {
    return this.projects.listProgress(id);
  }

  @Post(':id/progress')
  @RequireModule(ModuleKey.DevProjects, AccessLevel.edit)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  addProgress(
    @Param('id') id: string,
    @Body() dto: CreateProgressDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @UploadedFile() file?: MemoryFile,
  ) {
    const photoUrl = file ? this.uploads.save(file, req).url : undefined;
    return this.projects.addProgress(id, dto, user.id, photoUrl);
  }
}
