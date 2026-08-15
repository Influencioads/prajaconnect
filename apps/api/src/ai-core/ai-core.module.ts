import { Global, Module } from '@nestjs/common';
import { AiCoreService } from './ai-core.service';
import { TranslationService } from './translation.service';

@Global()
@Module({
  providers: [AiCoreService, TranslationService],
  exports: [AiCoreService, TranslationService],
})
export class AiCoreModule {}
