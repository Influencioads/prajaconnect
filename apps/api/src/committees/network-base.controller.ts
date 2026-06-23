import { Body, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddActivityDto, ImportCsvDto } from './dto/network.dto';
import { NetworkBaseService } from './network-base.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared route surface for the member-type network entities. Concrete
 * controllers extend this, supply their own `@Controller('...')` decorator and
 * inject the matching service.
 */
export abstract class NetworkBaseController {
  protected abstract get service(): NetworkBaseService;

  @Get()
  list(@Query() query: Record<string, any>) {
    return this.service.list(query);
  }

  @Get('stats')
  stats(@Query() query: Record<string, any>) {
    return this.service.stats(query);
  }

  @Get('export')
  async export(@Query() query: Record<string, any>, @Res() res: Response) {
    const { filename, csv } = await this.service.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Post('import')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  import(@Body() dto: ImportCsvDto, @CurrentUser('id') userId: string) {
    return this.service.importCsv(dto.csv, userId);
  }

  @Post(':id/activity')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  addActivity(@Param('id') id: string, @Body() dto: AddActivityDto, @CurrentUser('id') userId: string) {
    return this.service.addActivity(id, dto, userId);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('id') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
