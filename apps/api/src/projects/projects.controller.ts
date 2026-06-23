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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './dto/project.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('projects')
@RequireModule(ModuleKey.DevProjects, AccessLevel.view)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query() query: ProjectQueryDto) {
    return this.projects.list(query);
  }

  @Get('stats')
  stats() {
    return this.projects.stats();
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
}
