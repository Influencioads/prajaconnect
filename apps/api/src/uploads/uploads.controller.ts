import { Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { UploadsService, type MemoryFile } from './uploads.service';

const MAX_BYTES = 10 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @RequireModule(ModuleKey.Assets, AccessLevel.edit)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  uploadAssets(@UploadedFile() file: MemoryFile, @Req() req: Request) {
    return this.uploads.save(file, req);
  }

  @Post('election')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  uploadElection(@UploadedFile() file: MemoryFile, @Req() req: Request) {
    return this.uploads.save(file, req);
  }

  @Post('compliance')
  @RequireModule(ModuleKey.Compliance, AccessLevel.edit)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  uploadCompliance(@UploadedFile() file: MemoryFile, @Req() req: Request) {
    return this.uploads.save(file, req);
  }

  @Post('documents')
  @RequireModule(ModuleKey.Documents, AccessLevel.edit)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  uploadDocuments(@UploadedFile() file: MemoryFile, @Req() req: Request) {
    return this.uploads.save(file, req);
  }

  @Post('branding')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  uploadBranding(@UploadedFile() file: MemoryFile, @Req() req: Request) {
    return this.uploads.save(file, req);
  }
}
