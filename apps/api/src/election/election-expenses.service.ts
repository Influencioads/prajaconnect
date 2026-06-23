import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import { ElectionApprovalAction, ElectionExpenseStatus, NotificationType } from '@praja/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';
import { ElectionCommonService } from './election-common.service';
import {
  CreateExpenseDto,
  ExpenseApprovalDto,
  ExpenseQueryDto,
  UpdateExpenseDto,
} from './dto/election.dto';

const expenseInclude = {
  category: { select: { id: true, name: true, label: true } },
  mandal: { select: { id: true, name: true } },
  village: { select: { id: true, name: true } },
  booth: { select: { id: true, number: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  approvals: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    include: { approver: { select: { id: true, name: true } } },
  },
} satisfies Prisma.ElectionExpenseInclude;

@Injectable()
export class ElectionExpensesService {
  constructor(
    private prisma: PrismaService,
    private common: ElectionCommonService,
  ) {}

  listCategories() {
    return this.prisma.electionExpenseCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async list(query: ExpenseQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const { page, limit, search } = query;
    const where: Prisma.ElectionExpenseWhereInput = { electionId };
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.mandalId) where.mandalId = query.mandalId;
    if (query.villageId) where.villageId = query.villageId;
    if (query.boothId) where.boothId = query.boothId;
    if (query.paymentMode) where.paymentMode = query.paymentMode;
    if (query.from || query.to) {
      where.expenseDate = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { paidBy: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.electionExpense.findMany({
        where,
        include: expenseInclude,
        orderBy: { expenseDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.electionExpense.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async get(id: string) {
    const row = await this.prisma.electionExpense.findUnique({ where: { id }, include: expenseInclude });
    if (!row) throw new NotFoundException('Expense not found');
    return row;
  }

  async create(dto: CreateExpenseDto, user: AuthenticatedUser) {
    const electionId = await this.common.resolveElectionId(dto.electionId);
    return this.prisma.electionExpense.create({
      data: {
        electionId,
        title: dto.title,
        categoryId: dto.categoryId,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        vendorName: dto.vendorName,
        paidBy: dto.paidBy,
        paymentMode: dto.paymentMode,
        receiptUrl: dto.receiptUrl,
        billUrl: dto.billUrl,
        notes: dto.notes,
        eventId: dto.eventId,
        activityId: dto.activityId,
        createdById: user.id,
        status: ElectionExpenseStatus.Pending,
      },
      include: expenseInclude,
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.get(id);
    return this.prisma.electionExpense.update({
      where: { id },
      data: {
        title: dto.title,
        categoryId: dto.categoryId,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        vendorName: dto.vendorName,
        paidBy: dto.paidBy,
        paymentMode: dto.paymentMode,
        status: dto.status,
        receiptUrl: dto.receiptUrl,
        billUrl: dto.billUrl,
        notes: dto.notes,
      },
      include: expenseInclude,
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.electionExpense.delete({ where: { id } });
    return { ok: true };
  }

  async approve(id: string, user: AuthenticatedUser, dto: ExpenseApprovalDto) {
    const expense = await this.get(id);
    if (expense.status === ElectionExpenseStatus.Approved) {
      throw new BadRequestException('Expense already approved');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.electionExpenseApproval.create({
        data: {
          expenseId: id,
          approverId: user.id,
          action: ElectionApprovalAction.Approved,
          remarks: dto.remarks,
        },
      });
      return tx.electionExpense.update({
        where: { id },
        data: { status: ElectionExpenseStatus.Approved },
        include: expenseInclude,
      });
    });
    await this.common.notifyExpenseCreator(
      id,
      'Expense approved',
      `"${expense.title}" (₹${expense.amount}) has been approved.`,
      '/election/expenses',
    );
    return updated;
  }

  async reject(id: string, user: AuthenticatedUser, dto: ExpenseApprovalDto) {
    const expense = await this.get(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.electionExpenseApproval.create({
        data: {
          expenseId: id,
          approverId: user.id,
          action: ElectionApprovalAction.Rejected,
          remarks: dto.remarks,
        },
      });
      return tx.electionExpense.update({
        where: { id },
        data: { status: ElectionExpenseStatus.Rejected },
        include: expenseInclude,
      });
    });
    await this.common.notifyExpenseCreator(
      id,
      'Expense rejected',
      `"${expense.title}" was rejected.${dto.remarks ? ` Reason: ${dto.remarks}` : ''}`,
      '/election/expenses',
    );
    return updated;
  }

  async stats(query: ExpenseQueryDto) {
    const electionId = await this.common.resolveElectionId(query.electionId);
    const [byCategory, byStatus, byPayment, total] = await Promise.all([
      this.prisma.electionExpense.groupBy({
        by: ['categoryId'],
        where: { electionId },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.electionExpense.groupBy({
        by: ['status'],
        where: { electionId },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.electionExpense.groupBy({
        by: ['paymentMode'],
        where: { electionId },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.electionExpense.aggregate({ where: { electionId }, _sum: { amount: true } }),
    ]);
    return { byCategory, byStatus, byPayment, totalAmount: total._sum.amount ?? 0 };
  }
}
