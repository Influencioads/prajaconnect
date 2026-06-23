import type {
  AppointmentRequest,
  AppointmentStatus,
  LeaderCalendarResponse,
  LeaderOfficeDashboard,
  LeaderScheduleBlock,
  Paginated,
} from '@praja/types';
import api from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export type { AppointmentRequest, AppointmentStatus, LeaderScheduleBlock };

export async function fetchLeaderOfficeDashboard(): Promise<LeaderOfficeDashboard> {
  const { data } = await api.get('/leader-office/dashboard');
  return data;
}

export async function fetchLeaderCalendar(params: { from?: string; to?: string; status?: string } = {}) {
  const { data } = await api.get<LeaderCalendarResponse>('/leader-office/calendar', {
    params: cleanParams(params),
  });
  return data;
}

export async function fetchLeaderAppointments(params: Record<string, unknown> = {}) {
  const { data } = await api.get<Paginated<AppointmentRequest>>('/leader-office/appointments', {
    params: cleanParams(params),
  });
  return data;
}

export async function fetchLeaderAppointment(id: string) {
  const { data } = await api.get<AppointmentRequest>(`/leader-office/appointments/${id}`);
  return data;
}

export async function createAppointment(body: {
  visitorName: string;
  mobile?: string;
  purpose: string;
  scheduledAt?: string;
}) {
  const { data } = await api.post<AppointmentRequest>('/leader-office/appointments', body);
  return data;
}

export async function updateAppointment(
  id: string,
  body: {
    visitorName?: string;
    mobile?: string;
    purpose?: string;
    status?: AppointmentStatus;
    scheduledAt?: string;
  },
) {
  const { data } = await api.patch<AppointmentRequest>(`/leader-office/appointments/${id}`, body);
  return data;
}

export async function deleteAppointment(id: string) {
  const { data } = await api.delete(`/leader-office/appointments/${id}`);
  return data;
}

export async function fetchLeaderVisitors(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/leader-office/visitors', { params: cleanParams(params) });
  return data;
}

export async function fetchLeaderSchedule(params: { from?: string; to?: string } = {}) {
  const { data } = await api.get<LeaderScheduleBlock[]>('/leader-office/schedule', {
    params: cleanParams(params),
  });
  return data;
}

export async function createScheduleBlock(body: { title: string; startAt: string; endAt: string }) {
  const { data } = await api.post<LeaderScheduleBlock>('/leader-office/schedule', body);
  return data;
}

export async function updateScheduleBlock(
  id: string,
  body: { title?: string; startAt?: string; endAt?: string },
) {
  const { data } = await api.patch<LeaderScheduleBlock>(`/leader-office/schedule/${id}`, body);
  return data;
}

export async function deleteScheduleBlock(id: string) {
  const { data } = await api.delete(`/leader-office/schedule/${id}`);
  return data;
}

export async function fetchLeaderVip(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/leader-office/vip', { params: cleanParams(params) });
  return data;
}

export async function fetchLeaderTasks(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/leader-office/tasks', { params: cleanParams(params) });
  return data;
}

export async function fetchLeaderNotes(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/leader-office/notes', { params: cleanParams(params) });
  return data;
}

export async function downloadLeaderVisitorsExport() {
  const response = await api.get('/leader-office/visitors/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'visitors.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

function toLocalDatetime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export { toLocalDatetime };
