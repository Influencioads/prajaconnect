import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AccessLevel, ModuleKey } from '@praja/types';
import { WhatsappService } from './whatsapp.service';
import { RequireModule } from '../common/decorators/require-module.decorator';

class SendMessageDto {
  @IsString()
  @MinLength(1)
  body!: string;
}

class BroadcastDto {
  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  audience?: string;
}

@Controller('whatsapp')
@RequireModule(ModuleKey.Whatsapp, AccessLevel.view)
export class WhatsappController {
  constructor(private readonly whatsapp: WhatsappService) {}

  @Get('conversations')
  conversations(@Query('search') search?: string) {
    return this.whatsapp.conversations(search);
  }

  @Get('conversations/:id')
  conversation(@Param('id') id: string) {
    return this.whatsapp.conversation(id);
  }

  @Post('conversations/:id/messages')
  @RequireModule(ModuleKey.Whatsapp, AccessLevel.edit)
  send(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.whatsapp.sendMessage(id, dto.body);
  }

  @Post('conversations/:id/inbound')
  @RequireModule(ModuleKey.Whatsapp, AccessLevel.edit)
  inbound(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.whatsapp.receiveInbound(id, dto.body);
  }

  @Post('broadcast')
  @RequireModule(ModuleKey.Whatsapp, AccessLevel.edit)
  broadcast(@Body() dto: BroadcastDto) {
    return this.whatsapp.broadcast(dto.body, dto.audience);
  }
}
