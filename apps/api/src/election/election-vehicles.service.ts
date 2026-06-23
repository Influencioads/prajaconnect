import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { ElectionExpenseStatus, PaymentMode } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ElectionCommonService } from './election-common.service';
import {
  CreateVehicleDto,
  FuelLogDto,
  TripLogDto,
  UpdateVehicleDto,
  VehicleAssignmentDto,
  VehicleQueryDto,
} from './dto/election.dto';

const vehicleInclude = {
  assignments: {
    orderBy: { createdAt: 'desc' as const },
    take: 3,
    include: {
      mandal: { select: { id: true, name: true } },
      village: { select: { id: true, name: true } },
      booth: { select: { id: true, number: true, name: true } },
    },
  },
  _count: { select: { tripLogs: true, fuelLogs: true } },
} satisfies Prisma.ElectionVehicleInclude;

@Injectable()
export class ElectionVehiclesService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  async list(query: VehicleQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const { page, limit, search } = query;
    const where: Prisma.ElectionVehicleWhereInput = { electionId };
    if (query.vehicleType) where.vehicleType = query.vehicleType;
    if (query.status) where.status = query.status;
    if (search) {
      where.OR = [
        { vehicleNumber: { contains: search, mode: 'insensitive' } },
        { driverName: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.electionVehicle.findMany({
        where,
        include: vehicleInclude,
        orderBy: { vehicleNumber: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionVehicle.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.electionVehicle.findUnique({
      where: { id },
      include: {
        ...vehicleInclude,
        tripLogs: { orderBy: { tripDate: 'desc' }, take: 20 },
        fuelLogs: { orderBy: { fuelDate: 'desc' }, take: 20 },
      },
    });
    if (!row) throw new NotFoundException('Vehicle not found');
    return row;
  }

  async create(dto: CreateVehicleDto) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    return this.prisma.electionVehicle.create({
      data: {
        electionId,
        vehicleNumber: dto.vehicleNumber,
        vehicleType: dto.vehicleType,
        ownerName: dto.ownerName,
        driverName: dto.driverName,
        driverMobile: dto.driverMobile,
        status: dto.status,
        documentUrls: dto.documentUrls,
        notes: dto.notes,
      },
      include: vehicleInclude,
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.get(id);
    return this.prisma.electionVehicle.update({
      where: { id },
      data: {
        vehicleNumber: dto.vehicleNumber,
        vehicleType: dto.vehicleType,
        ownerName: dto.ownerName,
        driverName: dto.driverName,
        driverMobile: dto.driverMobile,
        status: dto.status,
        documentUrls: dto.documentUrls,
        notes: dto.notes,
      },
      include: vehicleInclude,
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.electionVehicle.delete({ where: { id } });
    return { ok: true };
  }

  async assign(id: string, dto: VehicleAssignmentDto) {
    await this.get(id);
    return this.prisma.electionVehicleAssignment.create({
      data: {
        vehicleId: id,
        purpose: dto.purpose,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
        toDate: dto.toDate ? new Date(dto.toDate) : undefined,
      },
      include: {
        mandal: { select: { id: true, name: true } },
        booth: { select: { id: true, number: true } },
      },
    });
  }

  async addTrip(id: string, dto: TripLogDto, user: AuthenticatedUser) {
    await this.get(id);
    return this.prisma.electionVehicleTripLog.create({
      data: {
        vehicleId: id,
        tripDate: dto.tripDate ? new Date(dto.tripDate) : new Date(),
        startKm: dto.startKm,
        endKm: dto.endKm,
        route: dto.route,
        gpsPlaceholder: dto.gpsPlaceholder,
        driverName: dto.driverName,
        notes: dto.notes,
        createdById: user.id,
      },
    });
  }

  async addFuel(id: string, dto: FuelLogDto, user: AuthenticatedUser) {
    const vehicle = await this.get(id);
    const fuelCat = await this.prisma.electionExpenseCategory.findFirst({ where: { name: 'Fuel' } });
    return this.prisma.$transaction(async (tx) => {
      let expenseId: string | undefined;
      if (dto.createExpense && fuelCat) {
        const expense = await tx.electionExpense.create({
          data: {
            electionId: vehicle.electionId,
            title: `Fuel - ${vehicle.vehicleNumber}`,
            categoryId: fuelCat.id,
            amount: dto.cost,
            expenseDate: dto.fuelDate ? new Date(dto.fuelDate) : new Date(),
            paymentMode: PaymentMode.Cash,
            status: ElectionExpenseStatus.Pending,
            createdById: user.id,
            notes: dto.notes,
          },
        });
        expenseId = expense.id;
      }
      return tx.electionVehicleFuelLog.create({
        data: {
          vehicleId: id,
          fuelDate: dto.fuelDate ? new Date(dto.fuelDate) : new Date(),
          liters: dto.liters,
          cost: dto.cost,
          expenseId,
          notes: dto.notes,
          createdById: user.id,
        },
      });
    });
  }

  async listTrips(id: string, page = 1, limit = 20) {
    await this.get(id);
    const where = { vehicleId: id };
    const [data, total] = await Promise.all([
      this.prisma.electionVehicleTripLog.findMany({
        where,
        orderBy: { tripDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionVehicleTripLog.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async listFuel(id: string, page = 1, limit = 20) {
    await this.get(id);
    const where = { vehicleId: id };
    const [data, total] = await Promise.all([
      this.prisma.electionVehicleFuelLog.findMany({
        where,
        orderBy: { fuelDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionVehicleFuelLog.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }
}
