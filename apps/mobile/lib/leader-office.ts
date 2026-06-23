import type {
  AppointmentRequest,
  AppointmentStatus,
  LeaderCalendarResponse,
  LeaderOfficeDashboard,
  LeaderScheduleBlock,
  Paginated,
} from '@praja/types';
import { api } from './api';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export type { AppointmentRequest, AppointmentStatus, LeaderScheduleBlock, LeaderOfficeDashboard };

export interface Visitor {
  id: string;
  name: string;
  mobile?: string | null;
  purpose?: string | null;
  checkInAt: string;
  checkOutAt?: string | null;
}

export async function fetchLeaderOfficeDashboard(): Promise<LeaderOfficeDashboard> {
  const { data } = await api.get('/leader-office/dashboard');
  return data;
}

export async function fetchLeaderCalendar(params: { from?: string; to?: string; status?: string } = {}) {
  const { data } = await api.get<LeaderCalendarResponse>('/leader-office/calendar', { params: clean(params) });
  return data;
}

export async function fetchLeaderAppointments(filters: Record<string, unknown> = {}) {
  const { data } = await api.get<Paginated<AppointmentRequest>>('/leader-office/appointments', {
    params: clean(filters),
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

export async function fetchLeaderSchedule(params: { from?: string; to?: string } = {}) {
  const { data } = await api.get<LeaderScheduleBlock[]>('/leader-office/schedule', { params: clean(params) });
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

export async function fetchLeaderVisitors(filters: Record<string, unknown> = {}): Promise<Paginated<Visitor>> {
  const { data } = await api.get('/leader-office/visitors', { params: clean(filters) });
  return data;
}

export async function checkInVisitor(body: { name: string; mobile?: string; purpose?: string }) {
  const { data } = await api.post('/leader-office/visitors', body);
  return data;
}

export async function checkOutVisitor(id: string) {
  const { data } = await api.patch(`/leader-office/visitors/${id}/checkout`);
  return data;
}

export function toIsoDatetimeLocal(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function formatDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
