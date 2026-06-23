import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface OfflineSyncDashboard {
  pending: number;
  synced: number;
  failed: number;
  conflicts: number;
}

export interface SyncConflict {
  id: string;
  resolution?: string | null;
  createdAt: string;
  queue: {
    id: string;
    entityType: string;
    payload: Record<string, unknown>;
    error?: string | null;
    deviceId: string;
  };
}

export async function fetchOfflineSyncDashboard(): Promise<OfflineSyncDashboard> {
  const { data } = await api.get('/offline-sync/dashboard');
  return data;
}

export async function fetchPendingConflicts(filters: Record<string, unknown> = {}): Promise<Paginated<SyncConflict>> {
  const { data } = await api.get('/offline-sync/conflicts/pending', { params: clean(filters) });
  return data;
}

export async function resolveSyncConflict(id: string, resolution: 'server' | 'client') {
  const { data } = await api.post(`/offline-sync/conflicts/${id}/resolve`, { resolution });
  return data;
}
