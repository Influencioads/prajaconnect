import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { ProtocolService } from './protocol.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import {
  CreateInvitationDto,
  InvitationDecisionDto,
  InvitationQueryDto,
  UpdateInvitationDto,
} from './dto/protocol.dto';

@Controller('leader-office/invitations')
@RequireModule(ModuleKey.Protocol, AccessLevel.view)
export class ProtocolController {
  constructor(private readonly service: ProtocolService) {}

  @Get()
  list(@Query() query: InvitationQueryDto) {
    return this.service.list(query);
  }

  // Must stay above ':id' so 'calendar' is not swallowed as an id.
  @Get('calendar')
  calendar(@Query('month') month?: string) {
    return this.service.calendar(month);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequireModule(ModuleKey.Protocol, AccessLevel.edit)
  create(@Body() body: CreateInvitationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(body, user?.id);
  }

  @Patch(':id')
  @RequireModule(ModuleKey.Protocol, AccessLevel.edit)
  update(@Param('id') id: string, @Body() body: UpdateInvitationDto) {
    return this.service.update(id, body);
  }

  @Post(':id/decision')
  @RequireModule(ModuleKey.Protocol, AccessLevel.edit)
  decide(
    @Param('id') id: string,
    @Body() body: InvitationDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.decide(id, body, user?.id);
  }

  @Delete(':id')
  @RequireModule(ModuleKey.Protocol, AccessLevel.edit)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
