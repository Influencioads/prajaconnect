import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { GeoService } from './geo.service';
import {
  CreateBoothDto,
  CreateConstituencyDto,
  CreateDistrictDto,
  CreateMandalDto,
  CreateStateDto,
  CreateVillageDto,
  UpdateBoothDto,
  UpdateConstituencyDto,
  UpdateDistrictDto,
  UpdateMandalDto,
  UpdateStateDto,
  UpdateVillageDto,
} from './dto/geo.dto';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  // Flat options used by every geo dropdown (any authenticated user).
  @Get('options')
  options() {
    return this.geoService.options();
  }

  // ===== Admin location management =====
  @Get('tree')
  @RequireModule(ModuleKey.Admin, AccessLevel.view)
  tree() {
    return this.geoService.tree();
  }

  // States
  @Post('states')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createState(@Body() dto: CreateStateDto) {
    return this.geoService.createState(dto);
  }

  @Patch('states/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateState(@Param('id') id: string, @Body() dto: UpdateStateDto) {
    return this.geoService.updateState(id, dto);
  }

  @Delete('states/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  deleteState(@Param('id') id: string) {
    return this.geoService.deleteState(id);
  }

  // Districts
  @Post('districts')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createDistrict(@Body() dto: CreateDistrictDto) {
    return this.geoService.createDistrict(dto);
  }

  @Patch('districts/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateDistrict(@Param('id') id: string, @Body() dto: UpdateDistrictDto) {
    return this.geoService.updateDistrict(id, dto);
  }

  @Delete('districts/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  deleteDistrict(@Param('id') id: string) {
    return this.geoService.deleteDistrict(id);
  }

  // Constituencies
  @Post('constituencies')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createConstituency(@Body() dto: CreateConstituencyDto) {
    return this.geoService.createConstituency(dto);
  }

  @Patch('constituencies/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateConstituency(@Param('id') id: string, @Body() dto: UpdateConstituencyDto) {
    return this.geoService.updateConstituency(id, dto);
  }

  @Delete('constituencies/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  deleteConstituency(@Param('id') id: string) {
    return this.geoService.deleteConstituency(id);
  }

  // Mandals
  @Post('mandals')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createMandal(@Body() dto: CreateMandalDto) {
    return this.geoService.createMandal(dto);
  }

  @Patch('mandals/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateMandal(@Param('id') id: string, @Body() dto: UpdateMandalDto) {
    return this.geoService.updateMandal(id, dto);
  }

  @Delete('mandals/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  deleteMandal(@Param('id') id: string) {
    return this.geoService.deleteMandal(id);
  }

  // Villages
  @Post('villages')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createVillage(@Body() dto: CreateVillageDto) {
    return this.geoService.createVillage(dto);
  }

  @Patch('villages/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateVillage(@Param('id') id: string, @Body() dto: UpdateVillageDto) {
    return this.geoService.updateVillage(id, dto);
  }

  @Delete('villages/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  deleteVillage(@Param('id') id: string) {
    return this.geoService.deleteVillage(id);
  }

  // Booths
  @Post('booths')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  createBooth(@Body() dto: CreateBoothDto) {
    return this.geoService.createBooth(dto);
  }

  @Patch('booths/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  updateBooth(@Param('id') id: string, @Body() dto: UpdateBoothDto) {
    return this.geoService.updateBooth(id, dto);
  }

  @Delete('booths/:id')
  @RequireModule(ModuleKey.Admin, AccessLevel.edit)
  deleteBooth(@Param('id') id: string) {
    return this.geoService.deleteBooth(id);
  }
}
