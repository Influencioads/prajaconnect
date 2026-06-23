import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NetworkBaseController } from './network-base.controller';
import { NetworkBaseService } from './network-base.service';
import { ObserversService } from './observers.service';
import { CreateObserverDto, UpdateObserverDto } from './dto/network.dto';

@Controller('observers')
@RequireModule(ModuleKey.Committees, AccessLevel.view)
export class ObserversController extends NetworkBaseController {
  constructor(private readonly observers: ObserversService) {
    super();
  }

  protected get service(): NetworkBaseService {
    return this.observers;
  }

  @Post()
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  create(@Body() dto: CreateObserverDto, @CurrentUser('id') userId: string) {
    return this.observers.create({ ...dto }, userId);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateObserverDto, @CurrentUser('id') userId: string) {
    return this.observers.update(id, { ...dto }, userId);
  }
}
