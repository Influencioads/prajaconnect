import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NetworkBaseController } from './network-base.controller';
import { NetworkBaseService } from './network-base.service';
import { PressService } from './press.service';
import { CreatePressDto, UpdatePressDto } from './dto/network.dto';

@Controller('press')
@RequireModule(ModuleKey.Committees, AccessLevel.view)
export class PressController extends NetworkBaseController {
  constructor(private readonly press: PressService) {
    super();
  }

  protected get service(): NetworkBaseService {
    return this.press;
  }

  @Post()
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  create(@Body() dto: CreatePressDto, @CurrentUser('id') userId: string) {
    return this.press.create({ ...dto }, userId);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Committees, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdatePressDto, @CurrentUser('id') userId: string) {
    return this.press.update(id, { ...dto }, userId);
  }
}
