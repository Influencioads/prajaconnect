import api from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchOfflineSyncDashboard() {
  const { data } = await api.get('/offline-sync/dashboard');
  return data;
}

export async function fetchOfflineSyncPending(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/offline-sync/pending', { params: cleanParams(params) });
  return data;
}

export async function fetchOfflineSyncConflicts(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/offline-sync/conflicts/pending', { params: cleanParams(params) });
  return data;
}

export async function resolveOfflineConflict(id: string, resolution: 'server' | 'client') {
  const { data } = await api.post(`/offline-sync/conflicts/${id}/resolve`, { resolution });
  return data;
}

export async function retryOfflineSyncItem(id: string) {
  const { data } = await api.patch(`/offline-sync/queue/${id}/retry`);
  return data;
}

export async function ingestOfflineBatch(body: {
  deviceId: string;
  items: Array<{ entityType: string; payload: Record<string, unknown> }>;
}) {
  const { data } = await api.post('/offline-sync/ingest', body);
  return data;
}
