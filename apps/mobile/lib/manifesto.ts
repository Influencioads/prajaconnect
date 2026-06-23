import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface ManifestoDashboard {
  totalPromises: number;
  avgCompletionPct: number;
  byStatus: Record<string, number>;
  recentPromises: ElectionPromise[];
}

export interface ElectionPromise {
  id: string;
  title: string;
  department?: string | null;
  completionPct: number;
  workStatus: string;
  updatedAt: string;
}

export async function fetchManifestoDashboard(): Promise<ManifestoDashboard> {
  const { data } = await api.get('/manifesto/dashboard');
  return data;
}

export async function fetchPromises(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionPromise>> {
  const { data } = await api.get('/manifesto/promises', { params: clean(filters) });
  return data;
}

export async function fetchPromise(id: string): Promise<ElectionPromise> {
  const { data } = await api.get(`/manifesto/promises/${id}`);
  return data;
}

export async function createPublicUpdate(body: { promiseId: string; note: string; isPublic?: boolean }) {
  const { data } = await api.post('/manifesto/public-updates', body);
  return data;
}
