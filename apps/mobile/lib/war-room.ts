import { api } from './api';

export async function fetchWarRoomDashboard() {
  const { data } = await api.get('/war-room/dashboard');
  return data;
}

export async function fetchWarRoomAlerts(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/war-room/alerts', { params });
  return data;
}

export async function resolveWarRoomAlert(id: string) {
  const { data } = await api.patch(`/war-room/alerts/${id}/resolve`);
  return data;
}

export async function fetchWarRoomEscalations(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/war-room/escalations', { params });
  return data;
}
