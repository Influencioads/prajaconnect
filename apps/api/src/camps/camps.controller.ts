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
import { CampsService } from './camps.service';
import {
  CampQueryDto,
  CreateCampDto,
  PreregisterMatchesDto,
  UpdateCampDto,
  UpdateRegistrationDto,
  WalkInDto,
} from './dto/camp.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('camps')
@RequireModule(ModuleKey.Camps, AccessLevel.view)
export class CampsController {
  constructor(private readonly camps: CampsService) {}

  @Get()
  list(@Query() query: CampQueryDto) {
    return this.camps.list(query);
  }

  @Get('stats')
  stats() {
    return this.camps.stats();
  }

  @Post()
  @RequireModule(ModuleKey.Camps, AccessLevel.edit)
  create(@Body() dto: CreateCampDto, @CurrentUser('id') userId: string) {
    return this.camps.create(dto, userId);
  }

  @Patch('registrations/:id')
  @RequireModule(ModuleKey.Camps, AccessLevel.edit)
  updateRegistration(@Param('id') id: string, @Body() dto: UpdateRegistrationDto) {
    return this.camps.updateRegistration(id, dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.camps.get(id);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Camps, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateCampDto) {
    return this.camps.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Camps, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.camps.remove(id);
  }

  @Post(':id/preregister-matches')
  @RequireModule(ModuleKey.Camps, AccessLevel.edit)
  preregister(@Param('id') id: string, @Body() dto: PreregisterMatchesDto) {
    return this.camps.preregisterMatches(id, dto);
  }

  @Post(':id/register')
  @RequireModule(ModuleKey.Camps, AccessLevel.edit)
  walkIn(@Param('id') id: string, @Body() dto: WalkInDto) {
    return this.camps.walkIn(id, dto);
  }

  @Get(':id/summary')
  summary(@Param('id') id: string) {
    return this.camps.summary(id);
  }

  @Post(':id/finalize')
  @RequireModule(ModuleKey.Camps, AccessLevel.edit)
  finalize(@Param('id') id: string) {
    return this.camps.finalize(id);
  }
}
