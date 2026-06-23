import { Injectable } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types';
import { D2dService } from './d2d.service';
import { D2DSyncBatchDto } from './dto/d2d.dto';

@Injectable()
export class D2dSyncService {
  constructor(
    private prisma: PrismaService,
    private d2d: D2dService,
  ) {}

  async syncBatch(dto: D2DSyncBatchDto, user: AuthenticatedUser) {
    const results: {
      households: { clientId?: string; serverId: string }[];
      responses: { clientId?: string; serverId: string }[];
      conflicts: string[];
    } = { households: [], responses: [], conflicts: [] };

    for (const h of dto.households ?? []) {
      const clientId = h.clientId ?? `hh-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const existing = await this.prisma.d2DSyncQueue.findUnique({ where: { clientId } });
      if (existing?.status === 'Synced') {
        results.conflicts.push(clientId);
        continue;
      }

      const household = await this.prisma.d2DHousehold.create({
        data: {
          houseNumber: h.houseNumber,
          headName: h.headName,
          mobile: h.mobile,
          whatsapp: h.whatsapp,
          address: h.address,
          ward: h.ward,
          street: h.street,
          mandalId: h.mandalId,
          villageId: h.villageId,
          boothId: h.boothId,
          latitude: h.latitude,
          longitude: h.longitude,
          surveyedById: user.id,
          members: h.members?.length
            ? {
                create: h.members.map((m) => ({
                  name: m.name,
                  age: m.age,
                  gender: m.gender as never,
                  voterId: m.voterId,
                  mobile: m.mobile,
                  occupation: m.occupation,
                  education: m.education,
                  votingPreference: m.votingPreference,
                  schemeBenefits: m.schemeBenefits as Prisma.InputJsonValue,
                  issues: m.issues as Prisma.InputJsonValue,
                })),
              }
            : undefined,
        },
      });

      await this.prisma.d2DSyncQueue.upsert({
        where: { clientId },
        create: {
          deviceId: dto.deviceId,
          clientId,
          payload: { type: 'household', id: household.id } as Prisma.InputJsonValue,
          status: 'Synced',
          syncedAt: new Date(),
        },
        update: { status: 'Synced', syncedAt: new Date(), attempts: { increment: 1 } },
      });

      results.households.push({ clientId: h.clientId, serverId: household.id });
    }

    for (const r of dto.responses ?? []) {
      const clientId = r.clientId ?? `resp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const existing = await this.prisma.d2DSyncQueue.findUnique({ where: { clientId } });
      if (existing?.status === 'Synced') {
        results.conflicts.push(clientId);
        continue;
      }

      const response = await this.d2d.createResponse(r, user);

      await this.prisma.d2DSyncQueue.upsert({
        where: { clientId },
        create: {
          deviceId: dto.deviceId,
          clientId,
          payload: { type: 'response', id: response.id } as Prisma.InputJsonValue,
          status: 'Synced',
          syncedAt: new Date(),
        },
        update: { status: 'Synced', syncedAt: new Date(), attempts: { increment: 1 } },
      });

      results.responses.push({ clientId: r.clientId, serverId: response.id });
    }

    return results;
  }

  async pendingCount(deviceId: string) {
    return this.prisma.d2DSyncQueue.count({
      where: { deviceId, status: 'Pending' },
    });
  }
}
