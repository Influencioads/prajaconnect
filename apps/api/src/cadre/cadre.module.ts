import { Module } from '@nestjs/common';
import { CadreService } from './cadre.service';
import { CadreController } from './cadre.controller';

@Module({
  controllers: [CadreController],
  providers: [CadreService],
})
export class CadreModule {}
