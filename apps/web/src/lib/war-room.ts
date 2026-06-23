import api from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchWarRoomDashboard() {
  const { data } = await api.get('/war-room/dashboard');
  return data;
}

export async function fetchWarRoomAlerts(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/war-room/alerts', { params: cleanParams(params) });
  return data;
}

export async function createWarRoomAlert(body: Record<string, unknown>) {
  const { data } = await api.post('/war-room/alerts', body);
  return data;
}

export async function resolveWarRoomAlert(id: string) {
  const { data } = await api.patch(`/war-room/alerts/${id}/resolve`);
  return data;
}

export async function fetchWarRoomEscalations(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/war-room/escalations', { params: cleanParams(params) });
  return data;
}

export async function updateWarRoomEscalation(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/war-room/escalations/${id}`, body);
  return data;
}

export async function fetchWarRoomReadinessBooths(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/war-room/readiness/booths', { params: cleanParams(params) });
  return data;
}

export async function fetchWarRoomReadinessMandals(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/war-room/readiness/mandals', { params: cleanParams(params) });
  return data;
}

export async function fetchWarRoomBriefings(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/war-room/briefings', { params: cleanParams(params) });
  return data;
}

export async function generateWarRoomBriefing() {
  const { data } = await api.post('/war-room/briefing');
  return data;
}

export async function downloadWarRoomReport(type: string) {
  const response = await api.get(`/war-room/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `war-room-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
