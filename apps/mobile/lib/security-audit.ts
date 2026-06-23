import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface LoginHistoryEntry {
  id: string;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export async function fetchSecurityLoginHistory(filters: Record<string, unknown> = {}): Promise<Paginated<LoginHistoryEntry>> {
  const { data } = await api.get('/security-audit/login-history', { params: clean(filters) });
  return data;
}
