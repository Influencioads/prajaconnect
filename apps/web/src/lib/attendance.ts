import api from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchAttendanceDashboard() {
  const { data } = await api.get('/attendance/dashboard');
  return data;
}

export async function fetchAttendanceRecords(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/attendance/records', { params: cleanParams(params) });
  return data;
}

export async function fetchAttendanceRecord(id: string) {
  const { data } = await api.get(`/attendance/records/${id}`);
  return data;
}

export async function fetchAttendanceCorrections(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/attendance/corrections', { params: cleanParams(params) });
  return data;
}

export async function approveAttendanceCorrection(id: string) {
  const { data } = await api.patch(`/attendance/corrections/${id}/approve`);
  return data;
}

export async function rejectAttendanceCorrection(id: string) {
  const { data } = await api.patch(`/attendance/corrections/${id}/reject`);
  return data;
}

export async function fetchFieldReports(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/attendance/field-reports', { params: cleanParams(params) });
  return data;
}

export async function fetchAttendanceMandalAggregates(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/attendance/aggregates/mandals', { params: cleanParams(params) });
  return data;
}

export async function fetchAttendanceBoothAggregates(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/attendance/aggregates/booths', { params: cleanParams(params) });
  return data;
}

export async function fetchGeoZones(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/attendance/geo-zones', { params: cleanParams(params) });
  return data;
}

export async function createGeoZone(body: Record<string, unknown>) {
  const { data } = await api.post('/attendance/geo-zones', body);
  return data;
}

export async function updateGeoZone(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/attendance/geo-zones/${id}`, body);
  return data;
}

export async function deleteGeoZone(id: string) {
  const { data } = await api.delete(`/attendance/geo-zones/${id}`);
  return data;
}

export async function downloadAttendanceReport(type: string) {
  const response = await api.get(`/attendance/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
