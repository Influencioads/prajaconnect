import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';

class DeviceTokenDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(1)
  platform!: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.list(user);
  }

  @Get('unread-count')
  unread(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user);
  }

  @Post('device-token')
  registerDeviceToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: DeviceTokenDto) {
    return this.notifications.registerDeviceToken(user, dto.token, dto.platform);
  }

  @Delete('device-token/:token')
  removeDeviceToken(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    return this.notifications.removeDeviceToken(user, token);
  }

  @Post(':id/read')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.markRead(user, id);
  }

  @Post('read-all')
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user);
  }
}
