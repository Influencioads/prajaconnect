import { UserRole } from './enums';

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: ApiMeta;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  roleLabel: string;
  language: string;
  designation?: string | null;
  photo?: string | null;
  constituencyId?: string | null;
  mandalId?: string | null;
  permissions?: { module: string; accessLevel: string }[];
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface KpiItem {
  label: string;
  value: string;
  delta?: string;
  good?: boolean;
  sub?: string;
  color?: string;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
