import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, AssetCategory, ModuleKey } from '@praja/types';
import { AssetsService } from './assets.service';
import {
  AddAttachmentDto,
  AddMaintenanceLogDto,
  AssetQueryDto,
  CreateAssetDto,
  ImportAssetsDto,
  UpdateAssetDto,
} from './dto/asset.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('assets')
@RequireModule(ModuleKey.Assets, AccessLevel.view)
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list(@Query() query: AssetQueryDto) {
    return this.assets.list(query);
  }

  @Get('stats')
  stats(@Query('category') category?: AssetCategory) {
    return this.assets.stats(category);
  }

  @Get('options')
  options() {
    return this.assets.options();
  }

  @Get('gis')
  gis(@Query('category') category?: AssetCategory) {
    return this.assets.gisPoints(category);
  }

  @Get('export')
  async export(@Query('category') category: AssetCategory | undefined, @Res() res: Response) {
    const { filename, csv } = await this.assets.exportCsv(category);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Post('import')
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  import(@Body() dto: ImportAssetsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assets.importCsv(dto.csv, dto.category, user);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.assets.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assets.create(dto, user);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assets.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Assets, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.assets.remove(id);
  }

  @Post(':id/logs')
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  addLog(@Param('id') id: string, @Body() dto: AddMaintenanceLogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assets.addLog(id, dto, user);
  }

  @Post(':id/photos')
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  addPhoto(@Param('id') id: string, @Body() dto: AddAttachmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assets.addPhoto(id, dto, user);
  }

  @Delete(':id/photos/:photoId')
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  removePhoto(@Param('id') id: string, @Param('photoId') photoId: string) {
    return this.assets.removePhoto(id, photoId);
  }

  @Post(':id/documents')
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  addDocument(@Param('id') id: string, @Body() dto: AddAttachmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assets.addDocument(id, dto, user);
  }

  @Delete(':id/documents/:documentId')
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  removeDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    return this.assets.removeDocument(id, documentId);
  }
}
