import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface CrisisDashboard {
  openIssues: number;
  activeIssues: number;
  escalationCount: number;
  recentIssues: CrisisIssue[];
}

export interface CrisisIssue {
  id: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCrisisDashboard(): Promise<CrisisDashboard> {
  const { data } = await api.get('/crisis/dashboard');
  return data;
}

export async function fetchCrisisIssues(filters: Record<string, unknown> = {}): Promise<Paginated<CrisisIssue>> {
  const { data } = await api.get('/crisis/issues', { params: clean(filters) });
  return data;
}

export async function fetchCrisisIssue(id: string): Promise<CrisisIssue> {
  const { data } = await api.get(`/crisis/issues/${id}`);
  return data;
}

export async function updateCrisisIssue(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/crisis/issues/${id}`, body);
  return data;
}

export async function addCrisisTimelineEntry(issueId: string, note: string) {
  const { data } = await api.post(`/crisis/issues/${issueId}/timeline`, { note });
  return data;
}
