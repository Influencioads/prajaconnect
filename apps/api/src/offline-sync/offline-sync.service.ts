import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OfflineSyncStatus, Prisma, ActivityStatus } from '@praja/database';
import { GrievanceChannel } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class OfflineSyncService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [pending, synced, failed, conflicts, byDevice, recentQueue] = await Promise.all([
      this.prisma.offlineSyncQueue.count({ where: { status: OfflineSyncStatus.Pending } }),
      this.prisma.offlineSyncQueue.count({ where: { status: OfflineSyncStatus.Synced } }),
      this.prisma.offlineSyncQueue.count({ where: { status: OfflineSyncStatus.Failed } }),
      this.prisma.syncConflict.count({ where: { resolvedAt: null } }),
      this.prisma.offlineSyncQueue.groupBy({
        by: ['deviceId'],
        _count: { _all: true },
        where: { status: OfflineSyncStatus.Pending },
      }),
      this.prisma.offlineSyncQueue.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { conflicts: true },
      }),
    ]);
    return { pending, synced, failed, conflicts, byDevice, recentQueue };
  }

  async ingestBatch(body: {
    deviceId: string;
    items: Array<{ entityType: string; payload: Record<string, unknown> }>;
  }) {
    const results: Array<{ id: string; entityType: string; status: OfflineSyncStatus; error?: string }> = [];

    for (const item of body.items) {
      const queueItem = await this.prisma.offlineSyncQueue.create({
        data: {
          deviceId: body.deviceId,
          entityType: item.entityType,
          payload: item.payload as Prisma.InputJsonValue,
          status: OfflineSyncStatus.Pending,
        },
      });

      try {
        await this.processEntity(item.entityType, item.payload);
        await this.prisma.offlineSyncQueue.update({
          where: { id: queueItem.id },
          data: { status: OfflineSyncStatus.Synced, syncedAt: new Date() },
        });
        results.push({ id: queueItem.id, entityType: item.entityType, status: OfflineSyncStatus.Synced });
      } catch (err) {
        const message = (err as Error).message;
        const isConflict = message.includes('CONFLICT');
        if (isConflict) {
          await this.prisma.syncConflict.create({
            data: { queueId: queueItem.id, resolution: null },
          });
          await this.prisma.offlineSyncQueue.update({
            where: { id: queueItem.id },
            data: { status: OfflineSyncStatus.Conflict, error: message },
          });
          results.push({ id: queueItem.id, entityType: item.entityType, status: OfflineSyncStatus.Conflict, error: message });
        } else {
          await this.prisma.offlineSyncQueue.update({
            where: { id: queueItem.id },
            data: { status: OfflineSyncStatus.Failed, error: message },
          });
          results.push({ id: queueItem.id, entityType: item.entityType, status: OfflineSyncStatus.Failed, error: message });
        }
      }
    }

    return { deviceId: body.deviceId, processed: results.length, results };
  }

  async listPending(query: PaginationDto, deviceId?: string) {
    const { page, limit } = query;
    const where: Prisma.OfflineSyncQueueWhereInput = {
      status: { in: [OfflineSyncStatus.Pending, OfflineSyncStatus.Failed, OfflineSyncStatus.Conflict] },
      ...(deviceId ? { deviceId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.offlineSyncQueue.findMany({
        where,
        include: { conflicts: true },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.offlineSyncQueue.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listConflicts(query: PaginationDto) {
    const { page, limit } = query;
    const where = { resolvedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.syncConflict.findMany({
        where,
        include: { queue: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.syncConflict.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async resolveConflict(id: string, resolution: string) {
    const conflict = await this.prisma.syncConflict.findUnique({
      where: { id },
      include: { queue: true },
    });
    if (!conflict) throw new NotFoundException('Conflict not found');
    if (conflict.resolvedAt) throw new BadRequestException('Conflict already resolved');

    const payload = conflict.queue.payload as Record<string, unknown>;
    if (resolution === 'server') {
      // Keep server data — discard offline change
    } else if (resolution === 'client') {
      await this.processEntity(conflict.queue.entityType, payload, true);
    } else {
      throw new BadRequestException('Resolution must be "server" or "client"');
    }

    await this.prisma.syncConflict.update({
      where: { id },
      data: { resolution, resolvedAt: new Date() },
    });
    await this.prisma.offlineSyncQueue.update({
      where: { id: conflict.queueId },
      data: { status: OfflineSyncStatus.Synced, syncedAt: new Date(), error: null },
    });
    return { id, resolution, resolved: true };
  }

  async retryQueueItem(id: string) {
    const item = await this.prisma.offlineSyncQueue.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Queue item not found');
    if (item.status !== OfflineSyncStatus.Failed) {
      throw new BadRequestException('Only failed items can be retried');
    }

    const payload = item.payload as Record<string, unknown>;
    try {
      await this.processEntity(item.entityType, payload);
      return this.prisma.offlineSyncQueue.update({
        where: { id },
        data: { status: OfflineSyncStatus.Synced, syncedAt: new Date(), error: null },
      });
    } catch (err) {
      const message = (err as Error).message;
      await this.prisma.offlineSyncQueue.update({
        where: { id },
        data: { status: OfflineSyncStatus.Failed, error: message },
      });
      throw new BadRequestException(message);
    }
  }

  async markSynced(id: string) {
    const item = await this.prisma.offlineSyncQueue.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Queue item not found');
    return this.prisma.offlineSyncQueue.update({
      where: { id },
      data: { status: OfflineSyncStatus.Synced, syncedAt: new Date() },
    });
  }

  private async processEntity(entityType: string, payload: Record<string, unknown>, force = false) {
    switch (entityType) {
      case 'grievance':
        return this.processGrievance(payload);
      case 'citizen_update':
        return this.processCitizenUpdate(payload, force);
      case 'task_update':
        return this.processTaskUpdate(payload, force);
      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  private async processGrievance(payload: Record<string, unknown>) {
    const title = String(payload.title ?? '');
    const description = String(payload.description ?? '');
    if (!title || !description) throw new BadRequestException('Grievance requires title and description');

    const codes = await this.prisma.grievance.findMany({ select: { code: true } });
    let max = 999;
    for (const { code } of codes) {
      const num = parseInt(code.replace(/\D/g, ''), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }

    return this.prisma.grievance.create({
      data: {
        code: `GRV-${max + 1}`,
        title,
        description,
        category: payload.category ? String(payload.category) : undefined,
        channel: GrievanceChannel.Mobile,
        reportedByName: payload.reportedByName ? String(payload.reportedByName) : undefined,
        reportedByMobile: payload.reportedByMobile ? String(payload.reportedByMobile) : undefined,
        villageId: payload.villageId ? String(payload.villageId) : undefined,
        mandalId: payload.mandalId ? String(payload.mandalId) : undefined,
        updates: {
          create: { action: 'Submitted', note: 'Synced from offline queue', byName: 'Field' },
        },
      },
    });
  }

  private async processCitizenUpdate(payload: Record<string, unknown>, force: boolean) {
    const id = String(payload.id ?? '');
    if (!id) throw new BadRequestException('citizen_update requires id');

    const existing = await this.prisma.citizen.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Citizen not found');

    const serverUpdated = existing.updatedAt.getTime();
    const clientUpdated = payload.updatedAt ? new Date(String(payload.updatedAt)).getTime() : 0;
    if (!force && clientUpdated && clientUpdated < serverUpdated) {
      throw new Error('CONFLICT: Server citizen record is newer');
    }

    return this.prisma.citizen.update({
      where: { id },
      data: {
        name: payload.name ? String(payload.name) : undefined,
        mobile: payload.mobile ? String(payload.mobile) : undefined,
        occupation: payload.occupation ? String(payload.occupation) : undefined,
        address: payload.address ? String(payload.address) : undefined,
        notes: payload.notes ? String(payload.notes) : undefined,
      },
    });
  }

  private async processTaskUpdate(payload: Record<string, unknown>, force: boolean) {
    const id = String(payload.id ?? '');
    if (!id) throw new BadRequestException('task_update requires id');

    const existing = await this.prisma.activity.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Task not found');

    const serverUpdated = existing.updatedAt.getTime();
    const clientUpdated = payload.updatedAt ? new Date(String(payload.updatedAt)).getTime() : 0;
    if (!force && clientUpdated && clientUpdated < serverUpdated) {
      throw new Error('CONFLICT: Server task record is newer');
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        title: payload.title ? String(payload.title) : undefined,
        description: payload.description ? String(payload.description) : undefined,
        status: payload.status ? (payload.status as ActivityStatus) : undefined,
        outcome: payload.outcome ? String(payload.outcome) : undefined,
        completedAt: payload.completedAt ? new Date(String(payload.completedAt)) : undefined,
      },
    });
  }
}
