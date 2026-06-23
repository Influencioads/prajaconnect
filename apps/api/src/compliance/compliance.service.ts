import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ElectionExpenseStatus,
  PermissionRequestStatus,
  PermissionRequestType,
  Prisma,
} from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [
      pendingPermissions,
      approvedPermissions,
      openAlerts,
      openNotices,
      documentCount,
      checklists,
      recentRequests,
    ] = await Promise.all([
      this.prisma.permissionRequest.count({
        where: { status: PermissionRequestStatus.Pending },
      }),
      this.prisma.permissionRequest.count({
        where: { status: PermissionRequestStatus.Approved },
      }),
      this.prisma.complianceAlert.count({ where: { resolved: false } }),
      this.prisma.legalNotice.count({ where: { status: 'Open' } }),
      this.prisma.complianceDocument.count(),
      this.prisma.complianceChecklist.findMany({
        include: {
          items: true,
          _count: { select: { items: true } },
        },
      }),
      this.prisma.permissionRequest.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { documents: true },
      }),
    ]);

    const checklistStats = checklists.map((c) => {
      const completed = c.items.filter((i) => i.completed).length;
      const total = c.items.length;
      return {
        id: c.id,
        name: c.name,
        completed,
        total,
        completionPct: total ? Math.round((completed / total) * 100) : 0,
      };
    });

    return {
      pendingPermissions,
      approvedPermissions,
      openAlerts,
      openNotices,
      documentCount,
      checklistStats,
      recentRequests,
    };
  }

  async listPermissionRequests(query: PaginationDto, status?: string, type?: string) {
    const { page, limit } = query;
    const where: { status?: PermissionRequestStatus; type?: PermissionRequestType } = {};
    if (status) where.status = status as PermissionRequestStatus;
    if (type) where.type = type as PermissionRequestType;

    const [data, total] = await Promise.all([
      this.prisma.permissionRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { documents: true },
      }),
      this.prisma.permissionRequest.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getPermissionRequest(id: string) {
    const row = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!row) throw new NotFoundException('Permission request not found');
    return row;
  }

  async createPermissionRequest(body: {
    type: string;
    title: string;
    details?: Record<string, unknown>;
  }) {
    return this.prisma.permissionRequest.create({
      data: {
        type: body.type as PermissionRequestType,
        title: body.title,
        details: body.details as Prisma.InputJsonValue | undefined,
      },
      include: { documents: true },
    });
  }

  async updatePermissionRequest(
    id: string,
    body: { title?: string; status?: string; details?: Record<string, unknown> },
  ) {
    const existing = await this.prisma.permissionRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Permission request not found');

    return this.prisma.permissionRequest.update({
      where: { id },
      data: {
        title: body.title,
        status: body.status as PermissionRequestStatus | undefined,
        details: body.details as Prisma.InputJsonValue | undefined,
      },
      include: { documents: true },
    });
  }

  async listChecklists(query: PaginationDto) {
    const { page, limit } = query;

    const [data, total] = await Promise.all([
      this.prisma.complianceChecklist.findMany({
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: { orderBy: { label: 'asc' } } },
      }),
      this.prisma.complianceChecklist.count(),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createChecklist(body: { name: string; items?: string[] }) {
    return this.prisma.complianceChecklist.create({
      data: {
        name: body.name,
        items: body.items?.length
          ? { create: body.items.map((label) => ({ label })) }
          : undefined,
      },
      include: { items: true },
    });
  }

  async updateChecklist(
    id: string,
    body: { name?: string; items?: { id: string; completed: boolean }[] },
  ) {
    const existing = await this.prisma.complianceChecklist.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Checklist not found');

    if (body.items?.length) {
      await Promise.all(
        body.items.map((item) =>
          this.prisma.complianceChecklistItem.update({
            where: { id: item.id },
            data: { completed: item.completed },
          }),
        ),
      );
    }

    return this.prisma.complianceChecklist.update({
      where: { id },
      data: { name: body.name },
      include: { items: true },
    });
  }

  async toggleChecklistItem(itemId: string, completed?: boolean) {
    const item = await this.prisma.complianceChecklistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Checklist item not found');

    return this.prisma.complianceChecklistItem.update({
      where: { id: itemId },
      data: { completed: completed ?? !item.completed },
    });
  }

  async listLegalNotices(query: PaginationDto, status?: string) {
    const { page, limit } = query;
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.legalNotice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { documents: true },
      }),
      this.prisma.legalNotice.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getLegalNotice(id: string) {
    const row = await this.prisma.legalNotice.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!row) throw new NotFoundException('Legal notice not found');
    return row;
  }

  async createLegalNotice(body: { title: string; reference?: string; status?: string }) {
    return this.prisma.legalNotice.create({
      data: {
        title: body.title,
        reference: body.reference,
        status: body.status ?? 'Open',
      },
      include: { documents: true },
    });
  }

  async updateLegalNotice(
    id: string,
    body: { title?: string; reference?: string; status?: string },
  ) {
    const existing = await this.prisma.legalNotice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Legal notice not found');

    return this.prisma.legalNotice.update({
      where: { id },
      data: body,
      include: { documents: true },
    });
  }

  async deleteLegalNotice(id: string) {
    const existing = await this.prisma.legalNotice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Legal notice not found');
    await this.prisma.legalNotice.delete({ where: { id } });
    return { ok: true };
  }

  async listDocuments(query: PaginationDto, permissionRequestId?: string, legalNoticeId?: string) {
    const { page, limit } = query;
    const where: Prisma.ComplianceDocumentWhereInput = {};
    if (permissionRequestId) where.permissionRequestId = permissionRequestId;
    if (legalNoticeId) where.legalNoticeId = legalNoticeId;

    const [data, total] = await Promise.all([
      this.prisma.complianceDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          permissionRequest: { select: { id: true, title: true, type: true } },
          legalNotice: { select: { id: true, title: true, reference: true } },
        },
      }),
      this.prisma.complianceDocument.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createDocument(body: {
    fileUrl: string;
    fileName?: string;
    permissionRequestId?: string;
    legalNoticeId?: string;
  }) {
    if (!body.permissionRequestId && !body.legalNoticeId) {
      throw new BadRequestException('Link document to a permission request or legal notice');
    }
    if (body.permissionRequestId) {
      const pr = await this.prisma.permissionRequest.findUnique({
        where: { id: body.permissionRequestId },
      });
      if (!pr) throw new NotFoundException('Permission request not found');
    }
    if (body.legalNoticeId) {
      const ln = await this.prisma.legalNotice.findUnique({ where: { id: body.legalNoticeId } });
      if (!ln) throw new NotFoundException('Legal notice not found');
    }

    return this.prisma.complianceDocument.create({
      data: {
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        permissionRequestId: body.permissionRequestId,
        legalNoticeId: body.legalNoticeId,
      },
      include: {
        permissionRequest: { select: { id: true, title: true } },
        legalNotice: { select: { id: true, title: true } },
      },
    });
  }

  async deleteDocument(id: string) {
    const existing = await this.prisma.complianceDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document not found');
    await this.prisma.complianceDocument.delete({ where: { id } });
    return { ok: true };
  }

  async listAlerts(query: PaginationDto, resolved?: boolean) {
    const { page, limit } = query;
    const where = resolved !== undefined ? { resolved } : {};

    const [data, total] = await Promise.all([
      this.prisma.complianceAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.complianceAlert.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async createAlert(body: { message: string; severity?: string }) {
    return this.prisma.complianceAlert.create({
      data: { message: body.message, severity: body.severity ?? 'Medium' },
    });
  }

  async resolveAlert(id: string) {
    const existing = await this.prisma.complianceAlert.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Alert not found');
    return this.prisma.complianceAlert.update({
      where: { id },
      data: { resolved: true },
    });
  }

  async expenseComplianceReport() {
    const election = await this.prisma.election.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!election) {
      return {
        election: null,
        summary: {
          totalExpenses: 0,
          totalAmount: 0,
          pendingApproval: 0,
          missingReceipts: 0,
          approvedAmount: 0,
        },
        byCategory: [],
        byStatus: [],
        flaggedExpenses: [],
      };
    }

    const expenses = await this.prisma.electionExpense.findMany({
      where: { electionId: election.id },
      include: {
        category: { select: { id: true, name: true, label: true } },
        mandal: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
    const pendingApproval = expenses.filter((e) => e.status === ElectionExpenseStatus.Pending).length;
    const missingReceipts = expenses.filter((e) => !e.receiptUrl && !e.billUrl).length;
    const approvedAmount = expenses
      .filter((e) => e.status === ElectionExpenseStatus.Approved)
      .reduce((s, e) => s + e.amount, 0);

    const categoryMap = new Map<string, { category: string; count: number; amount: number; missingDocs: number }>();
    for (const e of expenses) {
      const key = e.category.label;
      const cur = categoryMap.get(key) ?? { category: key, count: 0, amount: 0, missingDocs: 0 };
      cur.count += 1;
      cur.amount += e.amount;
      if (!e.receiptUrl && !e.billUrl) cur.missingDocs += 1;
      categoryMap.set(key, cur);
    }

    const statusMap = new Map<string, { status: string; count: number; amount: number }>();
    for (const e of expenses) {
      const cur = statusMap.get(e.status) ?? { status: e.status, count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += e.amount;
      statusMap.set(e.status, cur);
    }

    const flaggedExpenses = expenses
      .filter((e) => !e.receiptUrl && !e.billUrl)
      .slice(0, 50)
      .map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        expenseDate: e.expenseDate,
        status: e.status,
        category: e.category.label,
        mandal: e.mandal?.name ?? null,
        issue: 'Missing receipt or bill',
      }));

    return {
      election: { id: election.id, name: election.name, type: election.type },
      summary: {
        totalExpenses: expenses.length,
        totalAmount,
        pendingApproval,
        missingReceipts,
        approvedAmount,
      },
      byCategory: [...categoryMap.values()],
      byStatus: [...statusMap.values()],
      flaggedExpenses,
    };
  }

  async exportExpenseComplianceCsv() {
    const report = await this.expenseComplianceReport();
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines: string[] = [];
    lines.push('Section,Field,Value');
    lines.push(['Summary', 'Election', report.election?.name ?? '—'].map(esc).join(','));
    lines.push(['Summary', 'Total Expenses', report.summary.totalExpenses].map(esc).join(','));
    lines.push(['Summary', 'Total Amount', report.summary.totalAmount].map(esc).join(','));
    lines.push(['Summary', 'Pending Approval', report.summary.pendingApproval].map(esc).join(','));
    lines.push(['Summary', 'Missing Receipts', report.summary.missingReceipts].map(esc).join(','));
    lines.push(['Summary', 'Approved Amount', report.summary.approvedAmount].map(esc).join(','));

    for (const c of report.byCategory) {
      lines.push(
        ['Category', c.category, `${c.count} items / ₹${c.amount} / ${c.missingDocs} missing docs`]
          .map(esc)
          .join(','),
      );
    }

    lines.push('');
    lines.push(
      ['Title', 'Amount', 'Date', 'Status', 'Category', 'Mandal', 'Issue'].map(esc).join(','),
    );
    for (const e of report.flaggedExpenses) {
      lines.push(
        [
          e.title,
          e.amount,
          e.expenseDate instanceof Date ? e.expenseDate.toISOString() : e.expenseDate,
          e.status,
          e.category,
          e.mandal ?? '',
          e.issue,
        ]
          .map(esc)
          .join(','),
      );
    }

    return lines.join('\n');
  }
}
