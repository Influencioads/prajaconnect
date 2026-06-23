import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { UploadsModule } from '../uploads/uploads.module';
import { SecurityAuditModule } from '../security-audit/security-audit.module';

@Module({
  imports: [UploadsModule, SecurityAuditModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
