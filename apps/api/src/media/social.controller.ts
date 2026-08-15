import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SocialService } from './social.service';

@Controller('social')
@RequireModule(ModuleKey.Social, AccessLevel.view)
export class SocialController {
  constructor(private readonly service: SocialService) {}

  @Get('posts')
  listPosts(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
  ) {
    return this.service.listPosts({ ...query, status, platform });
  }

  @Post('posts')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  createPost(
    @Body() body: { platform: string; content: string; mediaUrl?: string; scheduledAt?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createPost(body, user.id);
  }

  @Post('posts/draft')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  draftPost(@Body() body: { topic: string; tone?: string }) {
    return this.service.draftPost(body.topic, body.tone);
  }

  @Patch('posts/:id')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  updatePost(
    @Param('id') id: string,
    @Body() body: { platform?: string; content?: string; mediaUrl?: string; scheduledAt?: string | null },
  ) {
    return this.service.updatePost(id, body);
  }

  @Delete('posts/:id')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  deletePost(@Param('id') id: string) {
    return this.service.deletePost(id);
  }

  @Patch('posts/:id/submit')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  submitPost(@Param('id') id: string) {
    return this.service.submitPost(id);
  }

  @Patch('posts/:id/approve')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  approvePost(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.approvePost(id, user.id);
  }

  @Patch('posts/:id/reject')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  rejectPost(@Param('id') id: string) {
    return this.service.rejectPost(id);
  }

  @Get('mentions')
  listMentions(
    @Query() query: PaginationDto,
    @Query('platform') platform?: string,
    @Query('sentiment') sentiment?: string,
  ) {
    return this.service.listMentions({ ...query, platform, sentiment });
  }

  @Post('scheduler/run')
  @RequireModule(ModuleKey.Social, AccessLevel.edit)
  runScheduler() {
    return this.service.processDuePosts();
  }
}
