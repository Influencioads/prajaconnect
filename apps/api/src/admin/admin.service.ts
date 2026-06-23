import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@praja/database';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';
import {
  AdminUserQueryDto,
  CreateRoleDto,
  CreateUserDto,
  ResetPasswordDto,
  UpdateRoleDto,
  UpdateUserDto,
  UpdateSettingsDto,
} from './dto/admin.dto';

const SETTING_CATEGORY_DEFAULTS: Record<string, string> = {
  app_name: 'general',
  support_email: 'general',
  party: 'org',
  state: 'org',
  default_constituency: 'org',
  party_full_name: 'branding',
  primary_color: 'branding',
  secondary_color: 'branding',
  accent_color: 'branding',
  logo_url: 'branding',
  default_language: 'localization',
  timezone: 'localization',
  date_format: 'localization',
  notify_sms: 'notifications',
  notify_whatsapp: 'notifications',
  notify_email: 'notifications',
  temp_grievance_validation_sla_hours: 'grievances',
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ===== Settings =====
  async listSettings() {
    const rows = await this.prisma.setting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
    const grouped = rows.reduce<Record<string, typeof rows>>((acc, row) => {
      (acc[row.category] ??= []).push(row);
      return acc;
    }, {});
    return { settings: rows, grouped };
  }

  async updateSettings(dto: UpdateSettingsDto) {
    await this.prisma.$transaction(
      dto.settings.map((item) => {
        const category = item.category ?? SETTING_CATEGORY_DEFAULTS[item.key] ?? 'general';
        return this.prisma.setting.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value, category },
        });
      }),
    );
    return this.listSettings();
  }

  // ===== Users =====
  async listUsers(query: AdminUserQueryDto) {
    const { page, limit, search, roleId, status } = query;
    const where: Prisma.UserWhereInput = {};
    if (roleId) where.roleId = roleId;
    if (status) where.status = status as Prisma.EnumUserStatusFilter['equals'];
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          status: true,
          designation: true,
          lastLoginAt: true,
          createdAt: true,
          role: { select: { id: true, name: true, label: true } },
          constituency: { select: { id: true, name: true } },
          mandal: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: paginate(page, limit, total) };
  }

  async createUser(dto: CreateUserDto) {
    await this.ensureRoleExists(dto.roleId);
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { mobile: dto.mobile }] },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A user with this email or mobile already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        mobile: dto.mobile,
        passwordHash,
        roleId: dto.roleId,
        designation: dto.designation,
        language: dto.language ?? 'en',
        constituencyId: dto.constituencyId,
        mandalId: dto.mandalId,
        status: dto.status ?? 'Active',
      },
      select: this.userSelect,
    });
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.ensureUserExists(id);
    if (dto.roleId) await this.ensureRoleExists(dto.roleId);
    if (dto.email || dto.mobile) {
      const clash = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(dto.email ? [{ email: dto.email.toLowerCase() }] : []),
            ...(dto.mobile ? [{ mobile: dto.mobile }] : []),
          ],
        },
        select: { id: true },
      });
      if (clash) throw new ConflictException('Another user already uses this email or mobile');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email?.toLowerCase(),
        mobile: dto.mobile,
        roleId: dto.roleId,
        designation: dto.designation,
        language: dto.language,
        constituencyId: dto.constituencyId,
        mandalId: dto.mandalId,
        status: dto.status,
      },
      select: this.userSelect,
    });
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    await this.ensureUserExists(id);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    // Revoke active sessions so the new password takes effect everywhere.
    await this.prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });
    return { success: true };
  }

  async deactivateUser(id: string) {
    await this.ensureUserExists(id);
    await this.prisma.user.update({ where: { id }, data: { status: 'Inactive' } });
    await this.prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });
    return { success: true };
  }

  // ===== Roles & permissions =====
  async listPermissions() {
    return this.prisma.permission.findMany({
      select: { module: true, label: true },
      orderBy: { module: 'asc' },
    });
  }

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
        permissions: {
          include: { permission: true },
          orderBy: { permission: { module: 'asc' } },
        },
      },
      orderBy: { rank: 'desc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      label: role.label,
      rank: role.rank,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        module: rp.permission.module,
        label: rp.permission.label,
        accessLevel: rp.accessLevel,
      })),
    }));
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name }, select: { id: true } });
    if (existing) throw new ConflictException('A role with this name already exists');

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        label: dto.label,
        rank: dto.rank ?? 0,
        description: dto.description,
        isSystem: false,
      },
    });
    if (dto.permissions?.length) await this.applyPermissions(role.id, dto.permissions);
    return this.getRole(role.id);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id }, select: { id: true } });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.role.update({
      where: { id },
      data: { label: dto.label, rank: dto.rank, description: dto.description },
    });
    if (dto.permissions) await this.applyPermissions(id, dto.permissions);
    return this.getRole(id);
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true, isSystem: true, _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('Built-in roles cannot be deleted');
    if (role._count.users > 0) {
      throw new BadRequestException('Reassign the users on this role before deleting it');
    }
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  // ===== helpers =====
  private userSelect = {
    id: true,
    name: true,
    email: true,
    mobile: true,
    status: true,
    designation: true,
    lastLoginAt: true,
    createdAt: true,
    role: { select: { id: true, name: true, label: true } },
    constituency: { select: { id: true, name: true } },
    mandal: { select: { id: true, name: true } },
  } satisfies Prisma.UserSelect;

  private async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
        permissions: { include: { permission: true }, orderBy: { permission: { module: 'asc' } } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return {
      id: role.id,
      name: role.name,
      label: role.label,
      rank: role.rank,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        module: rp.permission.module,
        label: rp.permission.label,
        accessLevel: rp.accessLevel,
      })),
    };
  }

  private async applyPermissions(
    roleId: string,
    permissions: { module: string; accessLevel: string }[],
  ) {
    const perms = await this.prisma.permission.findMany({ select: { id: true, module: true } });
    const byModule = new Map(perms.map((p) => [p.module, p.id]));

    await this.prisma.$transaction(
      permissions
        .filter((p) => byModule.has(p.module))
        .map((p) => {
          const permissionId = byModule.get(p.module)!;
          return this.prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId } },
            update: { accessLevel: p.accessLevel as Prisma.RolePermissionUpdateInput['accessLevel'] },
            create: {
              roleId,
              permissionId,
              accessLevel: p.accessLevel as Prisma.RolePermissionCreateInput['accessLevel'],
            },
          });
        }),
    );
  }

  private async ensureUserExists(id: string) {
    const found = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('User not found');
  }

  private async ensureRoleExists(id: string) {
    const found = await this.prisma.role.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new BadRequestException('Selected role does not exist');
  }
}
