import { api } from './api';

export async function fetchAttendanceDashboard() {
  const { data } = await api.get('/attendance/dashboard');
  return data;
}

export async function fetchMyActiveSession(cadreId: string) {
  const { data } = await api.get('/attendance/records', { params: { cadreId, limit: 1, page: 1 } });
  const active = (data.data ?? []).find((r: { checkOutAt?: string | null }) => !r.checkOutAt);
  return active ?? null;
}

export async function checkIn(body: {
  cadreId: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}) {
  const { data } = await api.post('/attendance/check-in', body);
  return data;
}

export async function checkOut(
  recordId: string,
  body: { latitude?: number; longitude?: number; notes?: string },
) {
  const { data } = await api.patch(`/attendance/records/${recordId}/check-out`, body);
  return data;
}

export async function submitRoutePoints(cadreId: string, points: { latitude: number; longitude: number }[]) {
  const { data } = await api.post('/attendance/route-points', { cadreId, points });
  return data;
}

export async function createCorrection(attendanceId: string, reason: string) {
  const { data } = await api.post('/attendance/corrections', { attendanceId, reason });
  return data;
}

export async function submitFieldReport(body: {
  cadreId: string;
  summary: string;
  tasksCompleted?: number;
}) {
  const { data } = await api.post('/attendance/field-reports', body);
  return data;
}

export async function resolveCadreId(mobile?: string): Promise<string | null> {
  const { data } = await api.get('/cadre', { params: { search: mobile, limit: 5 } });
  const match = (data.data ?? []).find((c: { mobile: string }) => c.mobile === mobile);
  if (match) return match.id;
  return data.data?.[0]?.id ?? null;
}
