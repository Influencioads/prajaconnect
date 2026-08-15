import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
@RequireModule(ModuleKey.Jobs, AccessLevel.view)
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get('sources')
  listSources() {
    return this.service.listSources();
  }

  @Post('sources')
  @RequireModule(ModuleKey.Jobs, AccessLevel.edit)
  createSource(@Body() body: { name: string; url: string; type?: string; active?: boolean }) {
    return this.service.createSource(body);
  }

  @Post('sources/test')
  @RequireModule(ModuleKey.Jobs, AccessLevel.edit)
  testSource(@Body() body: { url: string }) {
    return this.service.testSource(body.url);
  }

  @Patch('sources/:id')
  @RequireModule(ModuleKey.Jobs, AccessLevel.edit)
  updateSource(
    @Param('id') id: string,
    @Body() body: { name?: string; url?: string; type?: string; active?: boolean },
  ) {
    return this.service.updateSource(id, body);
  }

  @Delete('sources/:id')
  @RequireModule(ModuleKey.Jobs, AccessLevel.edit)
  deleteSource(@Param('id') id: string) {
    return this.service.deleteSource(id);
  }

  @Get('postings')
  listPostings(@Query() query: PaginationDto, @Query('status') status?: string) {
    return this.service.listPostings({ ...query, status });
  }

  @Get('postings/:id')
  getPosting(@Param('id') id: string) {
    return this.service.getPosting(id);
  }

  @Patch('postings/:id/status')
  @RequireModule(ModuleKey.Jobs, AccessLevel.edit)
  updatePostingStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updatePostingStatus(id, body.status);
  }

  @Post('run')
  @RequireModule(ModuleKey.Jobs, AccessLevel.edit)
  runNow() {
    return this.service.runCycle(true);
  }

  @Get(':id/matches')
  matches(@Param('id') id: string) {
    return this.service.matches(id);
  }

  @Post(':id/dispatch')
  @RequireModule(ModuleKey.Jobs, AccessLevel.edit)
  dispatch(
    @Param('id') id: string,
    @Body() body: { channels?: string[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.dispatchToCitizens(id, body.channels ?? [], user.id);
  }
}
