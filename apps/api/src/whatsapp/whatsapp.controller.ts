import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { AccessLevel, ModuleKey } from '@praja/types';
import { WhatsappService } from './whatsapp.service';
import { WhatsappBotService } from './whatsapp-bot.service';
import { WhatsappBotConfigService } from './whatsapp-bot-config.service';
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

class BotConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  greeting?: string;
}

@Controller('whatsapp')
@RequireModule(ModuleKey.Whatsapp, AccessLevel.view)
export class WhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly bot: WhatsappBotService,
    private readonly botConfig: WhatsappBotConfigService,
  ) {}

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
  async inbound(@Param('id') id: string, @Body() dto: SendMessageDto) {
    const message = await this.whatsapp.receiveInbound(id, dto.body);
    // Simulated inbound goes through the same bot pipeline as the real webhook.
    await this.bot.handleInbound(id, dto.body, message.id).catch(() => undefined);
    return message;
  }

  @Get('bot-config')
  getBotConfig() {
    return this.botConfig.getConfig();
  }

  @Put('bot-config')
  @RequireModule(ModuleKey.Whatsapp, AccessLevel.edit)
  updateBotConfig(@Body() dto: BotConfigDto) {
    return this.botConfig.updateConfig(dto);
  }

  @Get('bot-sessions')
  botSessions() {
    return this.bot.listSessions();
  }

  @Post('conversations/:id/bot-resume')
  @RequireModule(ModuleKey.Whatsapp, AccessLevel.edit)
  botResume(@Param('id') id: string) {
    return this.bot.resume(id);
  }

  @Post('broadcast')
  @RequireModule(ModuleKey.Whatsapp, AccessLevel.edit)
  broadcast(@Body() dto: BroadcastDto) {
    return this.whatsapp.broadcast(dto.body, dto.audience);
  }
}
