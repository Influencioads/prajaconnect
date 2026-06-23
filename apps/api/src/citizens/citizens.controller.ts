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
import { CitizensService } from './citizens.service';
import {
  CitizenQueryDto,
  CreateCitizenDto,
  CreateFamilyDto,
  UpdateCitizenDto,
} from './dto/citizen.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('citizens')
@RequireModule(ModuleKey.Citizens, AccessLevel.view)
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Get()
  list(@Query() query: CitizenQueryDto) {
    return this.citizensService.list(query);
  }

  @Get('stats')
  stats() {
    return this.citizensService.stats();
  }

  @Get('families')
  families(@Query('search') search?: string) {
    return this.citizensService.families(search);
  }

  @Post('families')
  @RequireModule(ModuleKey.Citizens, AccessLevel.edit)
  createFamily(@Body() dto: CreateFamilyDto) {
    return this.citizensService.createFamily(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.citizensService.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Citizens, AccessLevel.edit)
  create(@Body() dto: CreateCitizenDto) {
    return this.citizensService.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Citizens, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateCitizenDto) {
    return this.citizensService.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Citizens, AccessLevel.full)
  remove(@Param('id') id: string) {
    return this.citizensService.remove(id);
  }
}
