import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { ElectionVehiclesService } from './election-vehicles.service';
import {
  CreateVehicleDto,
  FuelLogDto,
  TripLogDto,
  UpdateVehicleDto,
  VehicleAssignmentDto,
  VehicleQueryDto,
} from './dto/election.dto';

@Controller('election/vehicles')
@RequireModule(ModuleKey.Election, AccessLevel.view)
export class ElectionVehiclesController {
  constructor(private readonly service: ElectionVehiclesService) {}

  @Get()
  list(@Query() query: VehicleQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Election, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/assignments')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  assign(@Param('id') id: string, @Body() dto: VehicleAssignmentDto) {
    return this.service.assign(id, dto);
  }

  @Get(':id/trips')
  trips(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.listTrips(id, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Post(':id/trips')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  addTrip(@Param('id') id: string, @Body() dto: TripLogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.addTrip(id, dto, user);
  }

  @Get(':id/fuel')
  fuel(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.listFuel(id, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Post(':id/fuel')
  @RequireModule(ModuleKey.Election, AccessLevel.edit)
  addFuel(@Param('id') id: string, @Body() dto: FuelLogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.addFuel(id, dto, user);
  }
}
