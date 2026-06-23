import { Module } from '@nestjs/common';
import { ManifestoController } from './manifesto.controller';
import { ManifestoService } from './manifesto.service';

@Module({
  controllers: [ManifestoController],
  providers: [ManifestoService],
  exports: [ManifestoService],
})
export class ManifestoModule {}
