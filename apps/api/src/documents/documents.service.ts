import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessLevel, Prisma } from '@praja/database';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { paginate, PaginationDto } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../common/types';

const LEVEL_RANK: Record<string, number> = {
  none: 0,
  view: 1,
  edit: 2,
  full: 3,
};

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private securityAudit: SecurityAuditService,
  ) {}

  private userModuleLevel(user: AuthenticatedUser): number {
    const perm = user.permissions.find((p) => p.module === 'documents');
    return LEVEL_RANK[perm?.accessLevel ?? 'none'] ?? 0;
  }

  private assertFolderAccess(folderId: string, user: AuthenticatedUser, action: 'view' | 'edit' | 'full') {
    const need = LEVEL_RANK[action] ?? 1;
    const userLevel = this.userModuleLevel(user);
    return this.prisma.documentFolder.findUnique({ where: { id: folderId } }).then((folder) => {
      if (!folder) throw new NotFoundException('Folder not found');
      const folderNeed = LEVEL_RANK[folder.permissionLevel] ?? 1;
      const required = Math.max(need, folderNeed);
      if (userLevel < required) {
        throw new ForbiddenException('Insufficient permission for this folder');
      }
      return folder;
    });
  }

  async dashboard() {
    const [folderCount, fileCount, categoryCount, recentFiles, recentAccess] = await Promise.all([
      this.prisma.documentFolder.count(),
      this.prisma.documentFile.count(),
      this.prisma.documentCategory.count(),
      this.prisma.documentFile.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { folder: { select: { id: true, name: true } } },
      }),
      this.prisma.documentAccessLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          file: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ]);
    return { folderCount, fileCount, categoryCount, recentFiles, recentAccess };
  }

  async listCategories() {
    return this.prisma.documentCategory.findMany({
      include: { _count: { select: { folders: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(body: { name: string }) {
    return this.prisma.documentCategory.create({ data: { name: body.name } });
  }

  async updateCategory(id: string, body: { name: string }) {
    return this.prisma.documentCategory.update({ where: { id }, data: { name: body.name } });
  }

  async deleteCategory(id: string) {
    const linked = await this.prisma.documentFolder.count({ where: { categoryId: id } });
    if (linked > 0) throw new BadRequestException('Category has linked folders');
    await this.prisma.documentCategory.delete({ where: { id } });
    return { success: true };
  }

  async listFolders(parentId?: string) {
    return this.prisma.documentFolder.findMany({
      where: parentId ? { parentId } : { parentId: null },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { files: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getFolderTree() {
    const folders = await this.prisma.documentFolder.findMany({
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { files: true } },
      },
      orderBy: { name: 'asc' },
    });
    const byParent = new Map<string | null, typeof folders>();
    for (const f of folders) {
      const key = f.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(f);
    }
    const build = (parentId: string | null): unknown[] =>
      (byParent.get(parentId) ?? []).map((f) => ({
        ...f,
        children: build(f.id),
      }));
    return build(null);
  }

  async createFolder(
    body: { name: string; parentId?: string; categoryId?: string; permissionLevel?: AccessLevel },
    user: AuthenticatedUser,
  ) {
    if (body.parentId) await this.assertFolderAccess(body.parentId, user, 'edit');
    return this.prisma.documentFolder.create({
      data: {
        name: body.name,
        parentId: body.parentId,
        categoryId: body.categoryId,
        permissionLevel: body.permissionLevel ?? AccessLevel.view,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async updateFolder(
    id: string,
    body: { name?: string; categoryId?: string | null; permissionLevel?: AccessLevel },
    user: AuthenticatedUser,
  ) {
    await this.assertFolderAccess(id, user, 'edit');
    return this.prisma.documentFolder.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.permissionLevel !== undefined ? { permissionLevel: body.permissionLevel } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async deleteFolder(id: string, user: AuthenticatedUser) {
    await this.assertFolderAccess(id, user, 'full');
    const childCount = await this.prisma.documentFolder.count({ where: { parentId: id } });
    if (childCount > 0) throw new BadRequestException('Folder has subfolders');
    const fileCount = await this.prisma.documentFile.count({ where: { folderId: id } });
    if (fileCount > 0) throw new BadRequestException('Folder is not empty');
    await this.prisma.documentFolder.delete({ where: { id } });
    return { success: true };
  }

  async listFiles(query: PaginationDto, filters: { folderId?: string; tags?: string; categoryId?: string }) {
    const { page, limit, search } = query;
    const where: Prisma.DocumentFileWhereInput = {};

    if (filters.folderId) where.folderId = filters.folderId;
    if (filters.tags) where.tags = { contains: filters.tags, mode: 'insensitive' };
    if (filters.categoryId) where.folder = { categoryId: filters.categoryId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.documentFile.findMany({
        where,
        include: {
          folder: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.documentFile.count({ where }),
    ]);
    return { data, meta: paginate(page, limit, total) };
  }

  async getFile(id: string, user: AuthenticatedUser) {
    const file = await this.prisma.documentFile.findUnique({
      where: { id },
      include: { folder: { include: { category: true } } },
    });
    if (!file) throw new NotFoundException('File not found');
    await this.assertFolderAccess(file.folderId, user, 'view');
    return file;
  }

  async createFile(
    body: { folderId: string; name: string; fileUrl: string; mimeType?: string; tags?: string },
    user: AuthenticatedUser,
  ) {
    await this.assertFolderAccess(body.folderId, user, 'edit');
    const file = await this.prisma.documentFile.create({
      data: {
        folderId: body.folderId,
        name: body.name,
        fileUrl: body.fileUrl,
        mimeType: body.mimeType,
        tags: body.tags,
      },
      include: { folder: { select: { id: true, name: true } } },
    });
    await this.logAccess(file.id, user.id, 'upload');
    return file;
  }

  async updateFile(
    id: string,
    body: { name?: string; tags?: string; folderId?: string },
    user: AuthenticatedUser,
  ) {
    const existing = await this.getFile(id, user);
    if (body.folderId && body.folderId !== existing.folderId) {
      await this.assertFolderAccess(body.folderId, user, 'edit');
    } else {
      await this.assertFolderAccess(existing.folderId, user, 'edit');
    }
    return this.prisma.documentFile.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
      },
      include: { folder: { select: { id: true, name: true } } },
    });
  }

  async deleteFile(id: string, user: AuthenticatedUser) {
    const file = await this.getFile(id, user);
    await this.assertFolderAccess(file.folderId, user, 'full');
    await this.prisma.documentFile.delete({ where: { id } });
    return { success: true };
  }

  async logAccess(fileId: string, userId: string | undefined, action: string) {
    return this.prisma.documentAccessLog.create({
      data: { fileId, userId, action },
    });
  }

  async recordView(id: string, user: AuthenticatedUser) {
    await this.getFile(id, user);
    await this.logAccess(id, user.id, 'view');
    const file = await this.prisma.documentFile.findUnique({ where: { id } });
    await this.securityAudit.logFileAccess(user.id, file!.fileUrl, 'view');
    return { fileUrl: file!.fileUrl, mimeType: file!.mimeType, name: file!.name };
  }

  async recordDownload(id: string, user: AuthenticatedUser) {
    await this.getFile(id, user);
    await this.logAccess(id, user.id, 'download');
    const file = await this.prisma.documentFile.findUnique({ where: { id } });
    await this.securityAudit.logFileAccess(user.id, file!.fileUrl, 'download');
    return { fileUrl: file!.fileUrl, mimeType: file!.mimeType, name: file!.name };
  }

  async exportCsv(type: string) {
    if (type === 'inventory') {
      const rows = await this.prisma.documentFile.findMany({
        include: {
          folder: { include: { category: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      const header = 'name,folder,category,mimeType,tags,createdAt';
      return [
        header,
        ...rows.map(
          (r) =>
            `"${r.name}","${r.folder.name}","${r.folder.category?.name ?? ''}","${r.mimeType ?? ''}","${r.tags ?? ''}",${r.createdAt.toISOString()}`,
        ),
      ].join('\n');
    }
    return 'type,unsupported';
  }
}
