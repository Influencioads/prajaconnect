import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface MediaDashboard {
  totalNews: number;
  pendingAttacks: number;
  draftResponses: number;
  reputationScore: number;
  recentAttacks: { id: string; title: string; responseStatus: string; createdAt: string }[];
}

export interface OppositionAttack {
  id: string;
  title: string;
  description?: string | null;
  responseStatus: string;
  createdAt: string;
}

export interface MediaResponse {
  id: string;
  attackId: string;
  content: string;
  status: string;
  createdAt: string;
  attack?: { id: string; title: string };
}

export async function fetchMediaDashboard(): Promise<MediaDashboard> {
  const { data } = await api.get('/media/dashboard');
  return data;
}

export async function fetchAttacks(filters: Record<string, unknown> = {}): Promise<Paginated<OppositionAttack>> {
  const { data } = await api.get('/media/attacks', { params: clean(filters) });
  return data;
}

export async function fetchMediaResponses(filters: Record<string, unknown> = {}): Promise<Paginated<MediaResponse>> {
  const { data } = await api.get('/media/responses', { params: clean(filters) });
  return data;
}

export async function createMediaResponse(body: { attackId: string; content: string; status?: string }) {
  const { data } = await api.post('/media/responses', body);
  return data;
}
