import { Body, Controller, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { AccessLevel, ModuleKey } from '@praja/types';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types';
import { BulletinService } from './bulletin.service';

@Controller('bulletin')
@RequireModule(ModuleKey.Bulletin, AccessLevel.view)
export class BulletinController {
  constructor(private readonly service: BulletinService) {}

  @Get()
  list(@Query('month') month?: string, @Query('edition') edition?: string) {
    return this.service.list(month, edition);
  }

  @Get('config')
  getConfig() {
    return this.service.getConfig();
  }

  @Put('config')
  @RequireModule(ModuleKey.Bulletin, AccessLevel.edit)
  setConfig(@Body() body: { enabled: boolean }) {
    return this.service.setEnabled(Boolean(body.enabled));
  }

  @Get('subscriptions')
  getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getSubscription(user.id);
  }

  @Put('subscriptions')
  putSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      scope?: string;
      mandalId?: string | null;
      channels?: { push?: boolean; whatsapp?: boolean; email?: boolean };
      sendAtHour?: number;
      active?: boolean;
    },
  ) {
    return this.service.putSubscription(user.id, body);
  }

  @Post('run')
  @RequireModule(ModuleKey.Bulletin, AccessLevel.edit)
  run(@Body() body: { date?: string; edition?: string }) {
    return this.service.run(body.date, body.edition ?? 'daily');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const { filePath, filename } = await this.service.getPdfFile(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    createReadStream(filePath).pipe(res);
  }
}
