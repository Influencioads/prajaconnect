import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  GroundIntelService,
  INFLUENCE_PERSON_TYPES,
  INFLUENCE_RELATIONS,
  OPPOSITION_ACTIVITY_TYPES,
} from './ground-intel.service';

@Controller('ground-intel')
@RequireModule(ModuleKey.GroundIntel, AccessLevel.view)
export class GroundIntelController {
  constructor(private readonly service: GroundIntelService) {}

  @Get('meta')
  meta() {
    return {
      personTypes: INFLUENCE_PERSON_TYPES,
      relations: INFLUENCE_RELATIONS,
      oppositionActivityTypes: OPPOSITION_ACTIVITY_TYPES,
    };
  }

  // ---- influence graph -------------------------------------------------
  @Get('links')
  listLinks(
    @Query() query: PaginationDto,
    @Query('mandalId') mandalId?: string,
    @Query('villageId') villageId?: string,
    @Query('boothId') boothId?: string,
    @Query('personType') personType?: string,
    @Query('relation') relation?: string,
    @Query('community') community?: string,
  ) {
    return this.service.listLinks({ ...query, mandalId, villageId, boothId, personType, relation, community });
  }

  @Post('links')
  @RequireModule(ModuleKey.GroundIntel, AccessLevel.edit)
  createLink(
    @Body()
    body: {
      personType: string;
      personId: string;
      boothId?: string;
      villageId?: string;
      community?: string;
      strength?: number;
      relation?: string;
      notes?: string;
    },
  ) {
    return this.service.createLink(body);
  }

  @Patch('links/:id')
  @RequireModule(ModuleKey.GroundIntel, AccessLevel.edit)
  updateLink(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateLink(id, body);
  }

  @Delete('links/:id')
  @RequireModule(ModuleKey.GroundIntel, AccessLevel.edit)
  removeLink(@Param('id') id: string) {
    return this.service.removeLink(id);
  }

  @Get('coverage')
  coverage(
    @Query('mandalId') mandalId?: string,
    @Query('villageId') villageId?: string,
    @Query('boothId') boothId?: string,
  ) {
    return this.service.coverage({ mandalId, villageId, boothId });
  }

  // ---- opposition tracker ---------------------------------------------
  @Get('opposition/heat')
  oppositionHeat(@Query('mandalId') mandalId?: string) {
    return this.service.oppositionHeat({ mandalId });
  }

  @Get('opposition')
  listOpposition(
    @Query() query: PaginationDto,
    @Query('mandalId') mandalId?: string,
    @Query('villageId') villageId?: string,
    @Query('boothId') boothId?: string,
    @Query('activityType') activityType?: string,
    @Query('rivalName') rivalName?: string,
    @Query('party') party?: string,
    @Query('sinceDays') sinceDays?: string,
  ) {
    return this.service.listOpposition({
      ...query,
      mandalId,
      villageId,
      boothId,
      activityType,
      rivalName,
      party,
      sinceDays: sinceDays ? Number(sinceDays) : undefined,
    });
  }

  @Post('opposition')
  @RequireModule(ModuleKey.GroundIntel, AccessLevel.edit)
  createOpposition(
    @Body()
    body: {
      rivalName: string;
      party?: string;
      activityType?: string;
      villageId?: string;
      mandalId?: string;
      boothId?: string;
      description: string;
      headcount?: number;
      photoUrl?: string;
      occurredAt?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createOpposition(body, user.id);
  }

  @Patch('opposition/:id')
  @RequireModule(ModuleKey.GroundIntel, AccessLevel.edit)
  updateOpposition(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateOpposition(id, body);
  }

  @Delete('opposition/:id')
  @RequireModule(ModuleKey.GroundIntel, AccessLevel.edit)
  removeOpposition(@Param('id') id: string) {
    return this.service.removeOpposition(id);
  }

  // ---- visit coverage --------------------------------------------------
  @Get('visit-coverage')
  visitCoverage(@Query('mandalId') mandalId?: string) {
    return this.service.visitCoverage({ mandalId });
  }

  @Get('visit-plan')
  visitPlan(@Query('mandalId') mandalId?: string) {
    return this.service.visitPlan({ mandalId });
  }
}
