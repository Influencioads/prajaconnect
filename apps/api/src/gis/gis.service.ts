import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GisService {
  constructor(private prisma: PrismaService) {}

  async grievancePoints() {
    const grievances = await this.prisma.grievance.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        latitude: true,
        longitude: true,
        mandal: { select: { name: true } },
      },
      take: 1000,
    });
    return grievances.map((g) => ({
      id: g.id,
      code: g.code,
      title: g.title,
      status: g.status,
      priority: g.priority,
      category: g.category,
      lat: g.latitude!,
      lng: g.longitude!,
      mandal: g.mandal?.name ?? null,
    }));
  }

  async mandalSummary() {
    const mandals = await this.prisma.mandal.findMany({
      select: {
        id: true,
        name: true,
        grievances: {
          where: { latitude: { not: null }, longitude: { not: null } },
          select: { latitude: true, longitude: true, status: true },
        },
        _count: { select: { grievances: true, citizens: true, cadres: true } },
      },
    });
    return mandals.map((m) => {
      const pts = m.grievances;
      const lat = pts.length
        ? pts.reduce((s, p) => s + (p.latitude ?? 0), 0) / pts.length
        : null;
      const lng = pts.length
        ? pts.reduce((s, p) => s + (p.longitude ?? 0), 0) / pts.length
        : null;
      const open = pts.filter(
        (p) => !['Resolved', 'Closed'].includes(p.status as string),
      ).length;
      return {
        id: m.id,
        name: m.name,
        lat,
        lng,
        grievances: m._count.grievances,
        openGrievances: open,
        citizens: m._count.citizens,
        cadres: m._count.cadres,
      };
    });
  }
}
