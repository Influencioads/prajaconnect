import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { FundsService } from './funds.service';
import {
  AdvanceStageDto,
  CreateFundSourceDto,
  CreateFundWorkDto,
  CreateInstallmentDto,
  FundWorkQueryDto,
  UpdateFundSourceDto,
  UpdateFundWorkDto,
} from './dto/funds.dto';

@Controller('funds')
@RequireModule(ModuleKey.Funds, AccessLevel.view)
export class FundsController {
  constructor(private readonly funds: FundsService) {}

  @Get('dashboard')
  dashboard() {
    return this.funds.dashboard();
  }

  @Get('sources')
  listSources() {
    return this.funds.listSources();
  }

  @Post('sources')
  @RequireModule(ModuleKey.Funds, AccessLevel.edit)
  createSource(@Body() dto: CreateFundSourceDto) {
    return this.funds.createSource(dto);
  }

  @Patch('sources/:id')
  @RequireModule(ModuleKey.Funds, AccessLevel.edit)
  updateSource(@Param('id') id: string, @Body() dto: UpdateFundSourceDto) {
    return this.funds.updateSource(id, dto);
  }

  @Get('works')
  listWorks(@Query() query: FundWorkQueryDto) {
    return this.funds.listWorks(query);
  }

  @Get('works/:id')
  getWork(@Param('id') id: string) {
    return this.funds.getWork(id);
  }

  @Post('works')
  @RequireModule(ModuleKey.Funds, AccessLevel.edit)
  createWork(@Body() dto: CreateFundWorkDto) {
    return this.funds.createWork(dto);
  }

  @Patch('works/:id')
  @RequireModule(ModuleKey.Funds, AccessLevel.edit)
  updateWork(@Param('id') id: string, @Body() dto: UpdateFundWorkDto) {
    return this.funds.updateWork(id, dto);
  }

  @Post('works/:id/stage')
  @RequireModule(ModuleKey.Funds, AccessLevel.edit)
  advanceStage(@Param('id') id: string, @Body() dto: AdvanceStageDto) {
    return this.funds.advanceStage(id, dto);
  }

  @Post('works/:id/installments')
  @RequireModule(ModuleKey.Funds, AccessLevel.edit)
  addInstallment(@Param('id') id: string, @Body() dto: CreateInstallmentDto) {
    return this.funds.addInstallment(id, dto);
  }

  /** Manual trigger for the monthly unspent-balance alert cron. */
  @Post('alerts/run')
  @RequireModule(ModuleKey.Funds, AccessLevel.edit)
  runAlert() {
    return this.funds.runUnspentAlert();
  }
}
