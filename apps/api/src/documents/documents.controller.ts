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
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { DocumentsService } from './documents.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UploadsService, type MemoryFile } from '../uploads/uploads.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';

const MAX_BYTES = 10 * 1024 * 1024;

@Controller('documents')
@RequireModule(ModuleKey.Documents, AccessLevel.view)
export class DocumentsController {
  constructor(
    private readonly service: DocumentsService,
    private readonly uploads: UploadsService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Post('categories')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  createCategory(@Body() body: { name: string }) {
    return this.service.createCategory(body);
  }

  @Patch('categories/:id')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  updateCategory(@Param('id') id: string, @Body() body: { name: string }) {
    return this.service.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @RequireModule(ModuleKey.Documents, AccessLevel.full)
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Get('folders')
  listFolders(@Query('parentId') parentId?: string) {
    return this.service.listFolders(parentId);
  }

  @Get('folders/tree')
  folderTree() {
    return this.service.getFolderTree();
  }

  @Post('folders')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  createFolder(
    @Body() body: { name: string; parentId?: string; categoryId?: string; permissionLevel?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createFolder(body as never, user);
  }

  @Patch('folders/:id')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  updateFolder(
    @Param('id') id: string,
    @Body() body: { name?: string; categoryId?: string | null; permissionLevel?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateFolder(id, body as never, user);
  }

  @Delete('folders/:id')
  @RequireModule(ModuleKey.Documents, AccessLevel.full)
  deleteFolder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.deleteFolder(id, user);
  }

  @Get('files')
  listFiles(
    @Query() query: PaginationDto,
    @Query('folderId') folderId?: string,
    @Query('tags') tags?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.listFiles(query, { folderId, tags, categoryId });
  }

  @Post('files')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  createFile(
    @Body() body: { folderId: string; name: string; fileUrl: string; mimeType?: string; tags?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createFile(body, user);
  }

  @Post('files/upload')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  uploadFile(
    @UploadedFile() file: MemoryFile,
    @Req() req: Request,
    @Body() body: { folderId: string; name?: string; tags?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const uploaded = this.uploads.save(file, req);
    return this.service.createFile(
      {
        folderId: body.folderId,
        name: body.name || file?.originalname || 'upload',
        fileUrl: uploaded.url,
        mimeType: uploaded.mimeType,
        tags: body.tags,
      },
      user,
    );
  }

  @Get('files/:id/view')
  viewFile(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.recordView(id, user);
  }

  @Get('files/:id/download')
  downloadFile(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.recordDownload(id, user);
  }

  @Get('files/:id')
  getFile(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getFile(id, user);
  }

  @Patch('files/:id')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  updateFile(
    @Param('id') id: string,
    @Body() body: { name?: string; tags?: string; folderId?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateFile(id, body, user);
  }

  @Delete('files/:id')
  @RequireModule(ModuleKey.Documents, AccessLevel.full)
  deleteFile(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.deleteFile(id, user);
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="documents.csv"')
  async exportCsv(@Param('type') type: string, @CurrentUser() user: AuthenticatedUser) {
    await this.securityAudit.logDataExport(user.id, `documents:${type}`);
    return this.service.exportCsv(type);
  }
}
