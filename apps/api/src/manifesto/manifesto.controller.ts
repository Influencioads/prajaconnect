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
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { ManifestoService } from './manifesto.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('manifesto')
@RequireModule(ModuleKey.Manifesto, AccessLevel.view)
export class ManifestoController {
  constructor(private readonly service: ManifestoService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('categories')
  listCategories(@Query() query: PaginationDto) {
    return this.service.listCategories(query);
  }

  @Post('categories')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  createCategory(@Body() body: { name: string }) {
    return this.service.createCategory(body);
  }

  @Patch('categories/:id')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  updateCategory(@Param('id') id: string, @Body() body: { name: string }) {
    return this.service.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Get('promises')
  listPromises(
    @Query() query: PaginationDto,
    @Query('workStatus') workStatus?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.listPromises(query, workStatus, categoryId);
  }

  @Get('promises/:id')
  getPromise(@Param('id') id: string) {
    return this.service.getPromise(id);
  }

  @Post('promises')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  createPromise(
    @Body() body: {
      title: string;
      categoryId?: string;
      department?: string;
      completionPct?: number;
      budgetTotal?: number;
      budgetSpent?: number;
      workStatus?: string;
    },
  ) {
    return this.service.createPromise(body);
  }

  @Patch('promises/:id')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  updatePromise(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      categoryId?: string;
      department?: string;
      completionPct?: number;
      budgetTotal?: number;
      budgetSpent?: number;
      workStatus?: string;
    },
  ) {
    return this.service.updatePromise(id, body);
  }

  @Get('public-updates')
  listPublicUpdates(@Query() query: PaginationDto, @Query('promiseId') promiseId?: string) {
    return this.service.listPublicUpdates(query, promiseId);
  }

  @Post('public-updates')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  createPublicUpdate(@Body() body: { promiseId: string; note: string; isPublic?: boolean }) {
    return this.service.createPublicUpdate(body);
  }

  @Patch('public-updates/:id')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  updatePublicUpdate(
    @Param('id') id: string,
    @Body() body: { note?: string; isPublic?: boolean },
  ) {
    return this.service.updatePublicUpdate(id, body);
  }

  @Delete('public-updates/:id')
  @RequireModule(ModuleKey.Manifesto, AccessLevel.edit)
  deletePublicUpdate(@Param('id') id: string) {
    return this.service.deletePublicUpdate(id);
  }

  @Get('departments/matrix')
  departmentMatrix() {
    return this.service.departmentMatrix();
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="manifesto-export.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
