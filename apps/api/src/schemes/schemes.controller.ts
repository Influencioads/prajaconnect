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
import { SchemesService } from './schemes.service';
import {
  CreateSchemeDto,
  EligibilityCheckDto,
  EnrollDto,
  SchemeQueryDto,
  UpdateBeneficiaryDto,
  UpdateSchemeDto,
} from './dto/scheme.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller()
@RequireModule(ModuleKey.Schemes, AccessLevel.view)
export class SchemesController {
  constructor(private readonly schemes: SchemesService) {}

  @Get('schemes')
  list(@Query() query: SchemeQueryDto) {
    return this.schemes.list(query);
  }

  @Get('schemes/stats')
  stats() {
    return this.schemes.stats();
  }

  @Post('schemes/eligibility')
  eligibility(@Body() dto: EligibilityCheckDto) {
    return this.schemes.checkEligibility(dto);
  }

  @Get('schemes/:id')
  get(@Param('id') id: string) {
    return this.schemes.get(id);
  }

  @Post('schemes')
  @RequireModule(ModuleKey.Schemes, AccessLevel.edit)
  create(@Body() dto: CreateSchemeDto) {
    return this.schemes.create(dto);
  }

  @Patch('schemes/:id')
  @RequireModule(ModuleKey.Schemes, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateSchemeDto) {
    return this.schemes.update(id, dto);
  }

  @Delete('schemes/:id')
  @RequireModule(ModuleKey.Schemes, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.schemes.remove(id);
  }

  @Post('schemes/:id/beneficiaries')
  @RequireModule(ModuleKey.Schemes, AccessLevel.edit)
  enroll(@Param('id') id: string, @Body() dto: EnrollDto) {
    return this.schemes.enroll(id, dto);
  }

  @Patch('beneficiaries/:id')
  @RequireModule(ModuleKey.Schemes, AccessLevel.edit)
  updateBeneficiary(@Param('id') id: string, @Body() dto: UpdateBeneficiaryDto) {
    return this.schemes.updateBeneficiary(id, dto);
  }
}
