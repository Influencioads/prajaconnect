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
import { VoterIntelligenceService } from './voter-intelligence.service';
import {
  CreateProfileDto,
  CreateSegmentDto,
  DuplicateQueryDto,
  ImportRollDto,
  ProfileQueryDto,
  ReviewDuplicateDto,
  UpdateProfileDto,
  UpdateSegmentDto,
} from './dto/voter-intelligence.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

@Controller('voter-intelligence')
@RequireModule(ModuleKey.VoterIntelligence, AccessLevel.view)
export class VoterIntelligenceController {
  constructor(private readonly service: VoterIntelligenceService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('profiles')
  listProfiles(@Query() query: ProfileQueryDto) {
    return this.service.listProfiles(query);
  }

  @Get('profiles/:id')
  getProfile(@Param('id') id: string) {
    return this.service.getProfile(id);
  }

  @Post('profiles')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.edit)
  createProfile(@Body() dto: CreateProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createProfile(dto, user);
  }

  @Patch('profiles/:id')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.edit)
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateProfile(id, dto, user);
  }

  @Get('segments')
  listSegments() {
    return this.service.listSegments();
  }

  @Post('segments')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.edit)
  createSegment(@Body() dto: CreateSegmentDto) {
    return this.service.createSegment(dto);
  }

  @Patch('segments/:id')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.edit)
  updateSegment(@Param('id') id: string, @Body() dto: UpdateSegmentDto) {
    return this.service.updateSegment(id, dto);
  }

  @Delete('segments/:id')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.full)
  deleteSegment(@Param('id') id: string) {
    return this.service.deleteSegment(id);
  }

  @Get('families')
  listFamilies(@Query() query: ProfileQueryDto) {
    return this.service.listFamilies(query);
  }

  @Get('booths')
  listBoothStrength(@Query() query: ProfileQueryDto) {
    return this.service.listBoothStrength(query);
  }

  @Get('duplicates')
  listDuplicates(@Query() query: DuplicateQueryDto) {
    return this.service.listDuplicates(query);
  }

  @Post('duplicates/detect')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.edit)
  detectDuplicates() {
    return this.service.detectDuplicates();
  }

  @Patch('duplicates/:id')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.edit)
  reviewDuplicate(
    @Param('id') id: string,
    @Body() dto: ReviewDuplicateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reviewDuplicate(id, dto, user);
  }

  @Post('import')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.edit)
  importRoll(@Body() dto: ImportRollDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.importRoll(dto, user);
  }

  @Post('sync-from-sources')
  @RequireModule(ModuleKey.VoterIntelligence, AccessLevel.full)
  syncFromSources() {
    return this.service.syncFromSources();
  }

  @Get('reports/export/:type')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="voter-intelligence.csv"')
  exportCsv(@Param('type') type: string) {
    return this.service.exportCsv(type);
  }
}
