import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { EventsService } from './events.service';
import { CheckInDto, CreateEventDto, EventQueryDto, UpdateEventDto } from './dto/event.dto';
import { RequireModule } from '../common/decorators/require-module.decorator';

@Controller('events')
@RequireModule(ModuleKey.Events, AccessLevel.view)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query() query: EventQueryDto) {
    return this.events.list(query);
  }

  @Get('stats')
  stats() {
    return this.events.stats();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.events.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Events, AccessLevel.edit)
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Events, AccessLevel.edit)
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update(id, dto);
  }

  @Post(':id/checkin')
  @RequireModule(ModuleKey.Events, AccessLevel.edit)
  checkIn(@Param('id') id: string, @Body() dto: CheckInDto) {
    return this.events.checkIn(id, dto);
  }
}
