import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionExpensesService } from './election-expenses.service';
import {
  CreateExpenseDto,
  ExpenseApprovalDto,
  ExpenseQueryDto,
  UpdateExpenseDto,
} from './dto/election.dto';

@Controller('election/expenses')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionExpensesController {
  constructor(private readonly service: ElectionExpensesService) {}

  @Get('categories')
  categories() {
    return this.service.listCategories();
  }

  @Get('stats')
  stats(@Query() query: ExpenseQueryDto) {
    return this.service.stats(query);
  }

  @Get()
  list(@Query() query: ExpenseQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/approve')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  approve(@Param('id') id: string, @Body() dto: ExpenseApprovalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.approve(id, user, dto);
  }

  @Post(':id/reject')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  reject(@Param('id') id: string, @Body() dto: ExpenseApprovalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.reject(id, user, dto);
  }
}
