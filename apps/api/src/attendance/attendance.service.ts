import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceCorrectionStatus } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async validateGeo(latitude?: number, longitude?: number) {
    if (latitude == null || longitude == null) {
      return { geoVerified: false, nearestZone: null, distanceM: null };
    }

    const zones = await this.prisma.geoFenceZone.findMany({
      include: { mandal: { select: { id: true, name: true } } },
    });
    if (!zones.length) {
      return { geoVerified: false, nearestZone: null, distanceM: null };
    }

    let nearest = zones[0];
    let minDist = haversineM(latitude, longitude, nearest.latitude, nearest.longitude);
    for (const zone of zones.slice(1)) {
      const dist = haversineM(latitude, longitude, zone.latitude, zone.longitude);
      if (dist < minDist) {
        minDist = dist;
        nearest = zone;
      }
    }

    return {
      geoVerified: minDist <= nearest.radiusM,
      nearestZone: nearest,
      distanceM: Math.round(minDist),
    };
  }

  async dashboard() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayCheckIns, activeSessions, pendingCorrections, todayFieldReports, recentRecords, geoZoneCount] =
      await Promise.all([
        this.prisma.volunteerAttendance.count({ where: { checkInAt: { gte: todayStart } } }),
        this.prisma.volunteerAttendance.count({ where: { checkOutAt: null } }),
        this.prisma.attendanceCorrectionRequest.count({
          where: { status: AttendanceCorrectionStatus.Pending },
        }),
        this.prisma.dailyFieldReport.count({ where: { reportDate: { gte: todayStart } } }),
        this.prisma.volunteerAttendance.findMany({
          take: 10,
          orderBy: { checkInAt: 'desc' },
          include: {
            cadre: { select: { id: true, name: true, mandal: { select: { name: true } } } },
          },
        }),
        this.prisma.geoFenceZone.count(),
      ]);

    const mandalAggregates = await this.buildMandalAggregates();
    const boothAggregates = await this.buildBoothAggregates();

    return {
      todayCheckIns,
      activeSessions,
      pendingCorrections,
      todayFieldReports,
      geoZoneCount,
      recentRecords,
      topMandals: mandalAggregates.slice(0, 5),
      topBooths: boothAggregates.slice(0, 5),
    };
  }

  private async buildMandalAggregates() {
    const cadres = await this.prisma.cadre.findMany({
      where: { mandalId: { not: null } },
      select: {
        mandalId: true,
        mandal: { select: { id: true, name: true } },
        volunteerAttendances: {
          select: { id: true, geoVerified: true, checkOutAt: true, checkInAt: true },
        },
      },
    });

    const map = new Map<
      string,
      {
        mandalId: string;
        mandal: { id: string; name: string };
        totalRecords: number;
        geoVerifiedCount: number;
        activeSessions: number;
        todayCheckIns: number;
      }
    >();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const cadre of cadres) {
      if (!cadre.mandalId || !cadre.mandal) continue;
      const key = cadre.mandalId;
      const entry = map.get(key) ?? {
        mandalId: cadre.mandalId,
        mandal: cadre.mandal,
        totalRecords: 0,
        geoVerifiedCount: 0,
        activeSessions: 0,
        todayCheckIns: 0,
      };
      for (const att of cadre.volunteerAttendances) {
        entry.totalRecords++;
        if (att.geoVerified) entry.geoVerifiedCount++;
        if (!att.checkOutAt) entry.activeSessions++;
        if (att.checkInAt >= todayStart) entry.todayCheckIns++;
      }
      map.set(key, entry);
    }

    return [...map.values()].sort((a, b) => b.totalRecords - a.totalRecords);
  }

  private async buildBoothAggregates() {
    const cadres = await this.prisma.cadre.findMany({
      where: { boothId: { not: null } },
      select: {
        boothId: true,
        booth: { select: { id: true, number: true, name: true } },
        volunteerAttendances: {
          select: { id: true, geoVerified: true, checkOutAt: true, checkInAt: true },
        },
      },
    });

    const map = new Map<
      string,
      {
        boothId: string;
        booth: { id: string; number: string; name: string | null };
        totalRecords: number;
        geoVerifiedCount: number;
        activeSessions: number;
        todayCheckIns: number;
      }
    >();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const cadre of cadres) {
      if (!cadre.boothId || !cadre.booth) continue;
      const key = cadre.boothId;
      const entry = map.get(key) ?? {
        boothId: cadre.boothId,
        booth: cadre.booth,
        totalRecords: 0,
        geoVerifiedCount: 0,
        activeSessions: 0,
        todayCheckIns: 0,
      };
      for (const att of cadre.volunteerAttendances) {
        entry.totalRecords++;
        if (att.geoVerified) entry.geoVerifiedCount++;
        if (!att.checkOutAt) entry.activeSessions++;
        if (att.checkInAt >= todayStart) entry.todayCheckIns++;
      }
      map.set(key, entry);
    }

    return [...map.values()].sort((a, b) => b.totalRecords - a.totalRecords);
  }

  async listAggregateMandals(query: PaginationDto) {
    const all = await this.buildMandalAggregates();
    const { page, limit } = query;
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, meta: paginate(page, limit, total) };
  }

  async listAggregateBooths(query: PaginationDto) {
    const all = await this.buildBoothAggregates();
    const { page, limit } = query;
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, meta: paginate(page, limit, total) };
  }

  async listRecords(query: PaginationDto, cadreId?: string) {
    const { page, limit } = query;
    const where = cadreId ? { cadreId } : {};

    const [data, total] = await Promise.all([
      this.prisma.volunteerAttendance.findMany({
        where,
        orderBy: { checkInAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cadre: {
            select: {
              id: true,
              name: true,
              mandal: { select: { name: true } },
              booth: { select: { number: true } },
            },
          },
          corrections: { where: { status: AttendanceCorrectionStatus.Pending } },
        },
      }),
      this.prisma.volunteerAttendance.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getRecord(id: string) {
    const record = await this.prisma.volunteerAttendance.findUnique({
      where: { id },
      include: {
        cadre: {
          select: {
            id: true,
            name: true,
            mobile: true,
            designation: true,
            mandal: { select: { name: true } },
            booth: { select: { number: true, name: true } },
          },
        },
        corrections: {
          include: { reviewedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async checkIn(body: {
    cadreId: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) {
    const active = await this.prisma.volunteerAttendance.findFirst({
      where: { cadreId: body.cadreId, checkOutAt: null },
    });
    if (active) throw new BadRequestException('Cadre already has an active check-in session');

    const geo = await this.validateGeo(body.latitude, body.longitude);

    return this.prisma.volunteerAttendance.create({
      data: {
        cadreId: body.cadreId,
        latitude: body.latitude,
        longitude: body.longitude,
        geoVerified: geo.geoVerified,
        notes: body.notes,
      },
      include: {
        cadre: { select: { id: true, name: true } },
      },
    });
  }

  async checkOut(
    id: string,
    body: { latitude?: number; longitude?: number; notes?: string },
  ) {
    const existing = await this.prisma.volunteerAttendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');
    if (existing.checkOutAt) throw new BadRequestException('Already checked out');

    const lat = body.latitude ?? existing.latitude ?? undefined;
    const lon = body.longitude ?? existing.longitude ?? undefined;
    const geo = await this.validateGeo(lat, lon);

    return this.prisma.volunteerAttendance.update({
      where: { id },
      data: {
        checkOutAt: new Date(),
        latitude: lat,
        longitude: lon,
        geoVerified: geo.geoVerified || existing.geoVerified,
        notes: body.notes ?? existing.notes,
      },
      include: { cadre: { select: { id: true, name: true } } },
    });
  }

  async listCorrections(query: PaginationDto, status?: string) {
    const { page, limit } = query;
    const where = status ? { status: status as AttendanceCorrectionStatus } : {};

    const [data, total] = await Promise.all([
      this.prisma.attendanceCorrectionRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          attendance: {
            include: { cadre: { select: { id: true, name: true } } },
          },
          reviewedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.attendanceCorrectionRequest.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createCorrection(body: { attendanceId: string; reason: string }) {
    return this.prisma.attendanceCorrectionRequest.create({
      data: { attendanceId: body.attendanceId, reason: body.reason },
      include: {
        attendance: { include: { cadre: { select: { id: true, name: true } } } },
      },
    });
  }

  async reviewCorrection(id: string, approved: boolean, reviewerId: string) {
    const existing = await this.prisma.attendanceCorrectionRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Correction request not found');
    if (existing.status !== AttendanceCorrectionStatus.Pending) {
      throw new BadRequestException('Correction request already reviewed');
    }

    return this.prisma.attendanceCorrectionRequest.update({
      where: { id },
      data: {
        status: approved ? AttendanceCorrectionStatus.Approved : AttendanceCorrectionStatus.Rejected,
        reviewedById: reviewerId,
      },
      include: {
        attendance: { include: { cadre: { select: { id: true, name: true } } } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
  }

  async rejectCorrection(id: string, reviewerId: string) {
    return this.reviewCorrection(id, false, reviewerId);
  }

  async listFieldReports(query: PaginationDto, cadreId?: string) {
    const { page, limit } = query;
    const where = cadreId ? { cadreId } : {};

    const [data, total] = await Promise.all([
      this.prisma.dailyFieldReport.findMany({
        where,
        orderBy: { reportDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { cadre: { select: { id: true, name: true } } },
      }),
      this.prisma.dailyFieldReport.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createFieldReport(body: {
    cadreId: string;
    summary: string;
    tasksCompleted?: number;
    reportDate?: string;
  }) {
    return this.prisma.dailyFieldReport.create({
      data: {
        cadreId: body.cadreId,
        summary: body.summary,
        tasksCompleted: body.tasksCompleted ?? 0,
        reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
      },
      include: { cadre: { select: { id: true, name: true } } },
    });
  }

  async updateFieldReport(id: string, body: { summary?: string; tasksCompleted?: number }) {
    const existing = await this.prisma.dailyFieldReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Field report not found');

    return this.prisma.dailyFieldReport.update({
      where: { id },
      data: body,
      include: { cadre: { select: { id: true, name: true } } },
    });
  }

  async listGeoZones(query: PaginationDto, mandalId?: string) {
    const { page, limit } = query;
    const where = mandalId ? { mandalId } : {};

    const [data, total] = await Promise.all([
      this.prisma.geoFenceZone.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { mandal: { select: { id: true, name: true } } },
      }),
      this.prisma.geoFenceZone.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getGeoZone(id: string) {
    const zone = await this.prisma.geoFenceZone.findUnique({
      where: { id },
      include: { mandal: { select: { id: true, name: true } } },
    });
    if (!zone) throw new NotFoundException('Geo-fence zone not found');
    return zone;
  }

  async createGeoZone(body: {
    name: string;
    latitude: number;
    longitude: number;
    radiusM?: number;
    mandalId?: string;
  }) {
    return this.prisma.geoFenceZone.create({
      data: {
        name: body.name,
        latitude: body.latitude,
        longitude: body.longitude,
        radiusM: body.radiusM ?? 100,
        mandalId: body.mandalId,
      },
      include: { mandal: { select: { id: true, name: true } } },
    });
  }

  async updateGeoZone(
    id: string,
    body: { name?: string; latitude?: number; longitude?: number; radiusM?: number; mandalId?: string },
  ) {
    await this.getGeoZone(id);
    return this.prisma.geoFenceZone.update({
      where: { id },
      data: body,
      include: { mandal: { select: { id: true, name: true } } },
    });
  }

  async deleteGeoZone(id: string) {
    await this.getGeoZone(id);
    await this.prisma.geoFenceZone.delete({ where: { id } });
    return { success: true };
  }

  async batchRoutePoints(body: { cadreId: string; points: { latitude: number; longitude: number; recordedAt?: string }[] }) {
    if (!body.points?.length) throw new BadRequestException('At least one route point is required');

    const data = body.points.map((p) => ({
      cadreId: body.cadreId,
      latitude: p.latitude,
      longitude: p.longitude,
      recordedAt: p.recordedAt ? new Date(p.recordedAt) : new Date(),
    }));

    await this.prisma.fieldRoutePoint.createMany({ data });
    return { created: data.length };
  }

  async exportCsv(type: string) {
    if (type === 'records') {
      const rows = await this.prisma.volunteerAttendance.findMany({
        take: 5000,
        include: { cadre: { select: { name: true } } },
        orderBy: { checkInAt: 'desc' },
      });
      const header = 'cadre,checkInAt,checkOutAt,geoVerified,latitude,longitude';
      return [
        header,
        ...rows.map(
          (r) =>
            `"${r.cadre.name}",${r.checkInAt.toISOString()},${r.checkOutAt?.toISOString() ?? ''},${r.geoVerified},${r.latitude ?? ''},${r.longitude ?? ''}`,
        ),
      ].join('\n');
    }
    if (type === 'corrections') {
      const rows = await this.prisma.attendanceCorrectionRequest.findMany({
        take: 5000,
        include: { attendance: { include: { cadre: { select: { name: true } } } } },
      });
      const header = 'cadre,reason,status,createdAt';
      return [
        header,
        ...rows.map(
          (r) =>
            `"${r.attendance.cadre.name}","${r.reason.replace(/"/g, '""')}","${r.status}",${r.createdAt.toISOString()}`,
        ),
      ].join('\n');
    }
    if (type === 'field-reports') {
      const rows = await this.prisma.dailyFieldReport.findMany({
        take: 5000,
        include: { cadre: { select: { name: true } } },
      });
      const header = 'cadre,reportDate,tasksCompleted,summary';
      return [
        header,
        ...rows.map(
          (r) =>
            `"${r.cadre.name}",${r.reportDate.toISOString()},${r.tasksCompleted},"${r.summary.replace(/"/g, '""')}"`,
        ),
      ].join('\n');
    }
    if (type === 'geo-zones') {
      const rows = await this.prisma.geoFenceZone.findMany({ take: 5000, include: { mandal: true } });
      const header = 'name,mandal,latitude,longitude,radiusM';
      return [
        header,
        ...rows.map(
          (r) => `"${r.name}","${r.mandal?.name ?? ''}",${r.latitude},${r.longitude},${r.radiusM}`,
        ),
      ].join('\n');
    }
    return 'type,unsupported';
  }
}
