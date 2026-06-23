import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';
import { OfflineSyncService } from './offline-sync.service';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('offline-sync')
@RequireModule(ModuleKey.OfflineSync, AccessLevel.view)
export class OfflineSyncController {
  constructor(private readonly service: OfflineSyncService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Post('ingest')
  @RequireModule(ModuleKey.OfflineSync, AccessLevel.edit)
  ingestBatch(
    @Body()
    body: {
      deviceId: string;
      items: Array<{ entityType: string; payload: Record<string, unknown> }>;
    },
  ) {
    return this.service.ingestBatch(body);
  }

  @Get('pending')
  listPending(@Query() query: PaginationDto, @Query('deviceId') deviceId?: string) {
    return this.service.listPending(query, deviceId);
  }

  @Get('conflicts/pending')
  listConflicts(@Query() query: PaginationDto) {
    return this.service.listConflicts(query);
  }

  @Post('conflicts/:id/resolve')
  @RequireModule(ModuleKey.OfflineSync, AccessLevel.edit)
  resolveConflict(@Param('id') id: string, @Body() body: { resolution: string }) {
    return this.service.resolveConflict(id, body.resolution);
  }

  @Patch('queue/:id/retry')
  @RequireModule(ModuleKey.OfflineSync, AccessLevel.edit)
  retryItem(@Param('id') id: string) {
    return this.service.retryQueueItem(id);
  }

  @Patch('queue/:id/sync')
  @RequireModule(ModuleKey.OfflineSync, AccessLevel.edit)
  markSynced(@Param('id') id: string) {
    return this.service.markSynced(id);
  }
}
