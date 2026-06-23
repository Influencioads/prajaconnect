import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { CadreService } from './cadre.service';
import { CadreQueryDto, CreateCadreDto, UpdateCadreDto } from './dto/cadre.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('cadre')
@RequireModule(ModuleKey.Cadre, AccessLevel.view)
export class CadreController {
  constructor(private readonly cadreService: CadreService) {}

  @Get()
  list(@Query() query: CadreQueryDto) {
    return this.cadreService.list(query);
  }

  @Get('stats')
  stats() {
    return this.cadreService.stats();
  }

  @Get('hierarchy')
  hierarchy() {
    return this.cadreService.hierarchy();
  }

  @Get('parent-options')
  parentOptions(@Query('exclude') exclude?: string) {
    return this.cadreService.parentOptions(exclude);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.cadreService.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Cadre, AccessLevel.edit)
  create(@Body() dto: CreateCadreDto) {
    return this.cadreService.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Cadre, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateCadreDto) {
    return this.cadreService.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Cadre, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.cadreService.remove(id);
  }
}
