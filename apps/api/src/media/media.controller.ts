import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { MediaService } from './media.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('media')
@RequireModule(ModuleKey.Media, AccessLevel.view)
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('news')
  listNews(@Query() query: PaginationDto) {
    return this.service.listNews(query);
  }

  @Get('news/:id')
  getNews(@Param('id') id: string) {
    return this.service.getNews(id);
  }

  @Post('news')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createNews(
    @Body() body: { title: string; source?: string; url?: string; sentiment?: string },
  ) {
    return this.service.createNews(body);
  }

  @Patch('news/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateNews(
    @Param('id') id: string,
    @Body() body: { title?: string; source?: string; url?: string; sentiment?: string },
  ) {
    return this.service.updateNews(id, body);
  }

  @Get('clippings')
  listClippings(@Query() query: PaginationDto) {
    return this.service.listClippings(query);
  }

  @Post('clippings')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createClipping(@Body() body: { title: string; clipDate?: string; fileUrl?: string }) {
    return this.service.createClipping(body);
  }

  @Patch('clippings/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateClipping(
    @Param('id') id: string,
    @Body() body: { title?: string; clipDate?: string; fileUrl?: string },
  ) {
    return this.service.updateClipping(id, body);
  }

  @Delete('clippings/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  deleteClipping(@Param('id') id: string) {
    return this.service.deleteClipping(id);
  }

  @Get('mentions')
  listMentions(@Query() query: PaginationDto, @Query('articleId') articleId?: string) {
    return this.service.listMentions(query, articleId);
  }

  @Get('attacks')
  listAttacks(@Query() query: PaginationDto) {
    return this.service.listAttacks(query);
  }

  @Get('attacks/:id')
  getAttack(@Param('id') id: string) {
    return this.service.getAttack(id);
  }

  @Post('attacks')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createAttack(@Body() body: { title: string; description?: string }) {
    return this.service.createAttack(body);
  }

  @Patch('attacks/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateAttack(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; responseStatus?: string },
  ) {
    return this.service.updateAttack(id, body);
  }

  @Get('responses')
  listResponses(@Query() query: PaginationDto, @Query('attackId') attackId?: string) {
    return this.service.listResponses(query, attackId);
  }

  @Get('responses/:id')
  getResponse(@Param('id') id: string) {
    return this.service.getResponse(id);
  }

  @Post('responses')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createResponse(@Body() body: { attackId: string; content: string; status?: string }) {
    return this.service.createResponse(body);
  }

  @Patch('responses/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateResponse(
    @Param('id') id: string,
    @Body() body: { content?: string; status?: string },
  ) {
    return this.service.updateResponse(id, body);
  }

  @Patch('responses/:id/approve')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  approveResponse(@Param('id') id: string) {
    return this.service.approveResponse(id);
  }

  @Patch('responses/:id/publish')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  publishResponse(@Param('id') id: string) {
    return this.service.publishResponse(id);
  }

  @Get('reputation')
  listReputation(@Query() query: PaginationDto) {
    return this.service.listReputationSnapshots(query);
  }

  @Post('reputation/compute')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  computeReputation() {
    return this.service.computeReputationScore();
  }

  @Get('social-listening')
  listSocialListening(@Query() query: PaginationDto) {
    return this.service.listSocialListening(query);
  }

  @Post('social-listening')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  createSocialListening(@Body() body: { platform: string; keyword: string; notes?: string }) {
    return this.service.createSocialListening(body);
  }

  @Patch('social-listening/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  updateSocialListening(
    @Param('id') id: string,
    @Body() body: { platform?: string; keyword?: string; notes?: string },
  ) {
    return this.service.updateSocialListening(id, body);
  }

  @Delete('social-listening/:id')
  @RequireModule(ModuleKey.Media, AccessLevel.edit)
  deleteSocialListening(@Param('id') id: string) {
    return this.service.deleteSocialListening(id);
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="media-export.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
