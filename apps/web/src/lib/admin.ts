import { api } from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  category: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: string;
  designation?: string | null;
  lastLoginAt?: string | null;
  role: { id: string; name: string; label: string };
  constituency?: { id: string; name: string } | null;
  mandal?: { id: string; name: string } | null;
}

export interface AdminRole {
  id: string;
  name: string;
  label: string;
  rank: number;
  description?: string | null;
  isSystem?: boolean;
  userCount: number;
  permissions: { module: string; label: string; accessLevel: string }[];
}

export interface AdminPermission {
  module: string;
  label: string;
}

export interface RolePermissionInput {
  module: string;
  accessLevel: string;
}

export interface CreateRoleInput {
  name: string;
  label: string;
  rank?: number;
  description?: string;
  permissions?: RolePermissionInput[];
}

export interface UpdateRoleInput {
  label?: string;
  rank?: number;
  description?: string;
  permissions?: RolePermissionInput[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
  roleId: string;
  designation?: string;
  language?: string;
  constituencyId?: string;
  mandalId?: string;
  status?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>>;

export async function fetchAdminSettings() {
  const { data } = await api.get('/admin/settings');
  return data as { settings: AppSetting[]; grouped: Record<string, AppSetting[]> };
}

export async function updateAdminSettings(
  settings: { key: string; value: string; category?: string }[],
) {
  const { data } = await api.patch('/admin/settings', { settings });
  return data;
}

export async function fetchAdminUsers(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/admin/users', { params: cleanParams(params) });
  return data as { data: AdminUser[]; meta: { page: number; limit: number; total: number; totalPages: number } };
}

export async function fetchAdminRoles() {
  const { data } = await api.get('/admin/roles');
  return data as AdminRole[];
}

export async function fetchPermissions() {
  const { data } = await api.get('/admin/permissions');
  return data as AdminPermission[];
}

export async function createRole(input: CreateRoleInput) {
  const { data } = await api.post('/admin/roles', input);
  return data as AdminRole;
}

export async function updateRole(id: string, input: UpdateRoleInput) {
  const { data } = await api.patch(`/admin/roles/${id}`, input);
  return data as AdminRole;
}

export async function deleteRole(id: string) {
  const { data } = await api.delete(`/admin/roles/${id}`);
  return data;
}

export async function createUser(input: CreateUserInput) {
  const { data } = await api.post('/admin/users', input);
  return data as AdminUser;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { data } = await api.patch(`/admin/users/${id}`, input);
  return data as AdminUser;
}

export async function deactivateUser(id: string) {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
}

export async function resetUserPassword(id: string, password: string) {
  const { data } = await api.post(`/admin/users/${id}/reset-password`, { password });
  return data;
}

export async function uploadBrandingLogo(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/uploads/branding', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { url: string; path: string; filename: string };
}

const SETTING_LABELS: Record<string, string> = {
  app_name: 'Application name',
  party: 'Party',
  party_full_name: 'Party full name',
  state: 'State',
  default_constituency: 'Default constituency',
  support_email: 'Support email',
  primary_color: 'Primary color',
  secondary_color: 'Secondary color',
  accent_color: 'Accent color',
  logo_url: 'Logo URL',
  default_language: 'Default language',
  timezone: 'Timezone',
  date_format: 'Date format',
  notify_sms: 'SMS notifications',
  notify_whatsapp: 'WhatsApp notifications',
  notify_email: 'Email notifications',
};

export function settingLabel(key: string) {
  return SETTING_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
