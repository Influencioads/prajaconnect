import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core/ai-core.module';
import { BrandingModule } from '../branding/branding.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';
import { LettersController } from './letters.controller';
import { LettersService } from './letters.service';

@Module({
  imports: [AiCoreModule, BrandingModule, NotificationsModule, PdfModule],
  controllers: [LettersController],
  providers: [LettersService],
})
export class LettersModule {}
