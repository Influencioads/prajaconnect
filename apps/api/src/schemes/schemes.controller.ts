import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AccessLevel, ModuleKey } from '@praja/types';
import { SchemesService } from './schemes.service';
import { SchemeMatcherService } from './scheme-matcher.service';
import {
  CreateSchemeDto,
  EligibilityCheckDto,
  EnrollDto,
  SchemeQueryDto,
  UpdateBeneficiaryDto,
  UpdateSchemeDto,
} from './dto/scheme.dto';
import { MatchQueryDto, UpdateMatchDto, WorklistQueryDto } from './dto/scheme-match.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@RequireModule(ModuleKey.Schemes, AccessLevel.view)
export class SchemesController {
  constructor(
    private readonly schemes: SchemesService,
    private readonly matcher: SchemeMatcherService,
  ) {}

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

  // ---- Proactive matcher ----
  @Post('schemes/matcher/run')
  @RequireModule(ModuleKey.Schemes, AccessLevel.edit)
  runMatcher() {
    return this.matcher.run();
  }

  @Get('scheme-matches/worklist')
  worklist(@CurrentUser('id') userId: string, @Query() query: WorklistQueryDto) {
    return this.matcher.worklist(userId, query.status);
  }

  // View-level on purpose: booth cadres (schemes: view) quick-update their worklist matches.
  @Patch('scheme-matches/:id')
  updateMatch(@Param('id') id: string, @Body() dto: UpdateMatchDto) {
    return this.matcher.updateMatch(id, dto);
  }

  @Get('schemes/:id/matches')
  matches(@Param('id') id: string, @Query() query: MatchQueryDto) {
    return this.matcher.listMatches(id, query);
  }

  @Get('schemes/:id/matches/export')
  async exportMatches(
    @Param('id') id: string,
    @Query() query: MatchQueryDto,
    @Res() res: Response,
  ) {
    const { filename, csv } = await this.matcher.exportMatches(id, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
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
