import { Module } from '@nestjs/common';
import { SchemesService } from './schemes.service';
import { SchemesController } from './schemes.controller';

@Module({
  controllers: [SchemesController],
  providers: [SchemesService],
})
export class SchemesModule {}
