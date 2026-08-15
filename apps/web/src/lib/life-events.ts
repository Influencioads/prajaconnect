import { api } from './api';
import type { Paginated } from './compliance';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface GreetingQueueItem {
  id: string;
  date: string;
  occasion: string;
  targetType: string;
  targetId: string;
  targetName: string;
  mobile?: string | null;
  message: string;
  messageTe?: string | null;
  status: string;
  sentVia?: Record<string, unknown> | null;
  createdAt: string;
}

export interface LifeEventsToday {
  date: string;
  items: GreetingQueueItem[];
  counts: { pending: number; approved: number; sent: number; skipped: number };
}

export interface LifeEventOccurrence {
  date: string;
  occasion: string;
  targetType: string;
  targetId: string;
  targetName: string;
  mobile?: string | null;
}

export interface LifeEventDeadline {
  date: string;
  occasion: string;
  targetType: string;
  targetId: string;
  targetName: string;
  message: string;
}

export interface LifeEventsUpcoming {
  from: string;
  days: number;
  events: LifeEventOccurrence[];
  deadlines: LifeEventDeadline[];
}

export interface GreetingTemplate {
  id: string;
  occasion: string;
  language: string;
  body: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CondolenceLog {
  id: string;
  citizenId?: string | null;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
  name: string;
  date: string;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export const GREETING_OCCASIONS = ['birthday', 'anniversary', 'condolence', 'festival'] as const;

export async function fetchLifeEventsToday(): Promise<LifeEventsToday> {
  const { data } = await api.get('/life-events/today');
  return data;
}

export async function fetchLifeEventsUpcoming(days = 7): Promise<LifeEventsUpcoming> {
  const { data } = await api.get('/life-events/upcoming', { params: { days } });
  return data;
}

export async function runLifeEventsScan() {
  const { data } = await api.post('/life-events/run');
  return data as { scanned: number; enqueued: number };
}

export async function fetchGreetingQueue(
  filters: Record<string, unknown> = {},
): Promise<Paginated<GreetingQueueItem>> {
  const { data } = await api.get('/life-events/queue', { params: clean(filters) });
  return data;
}

export async function approveGreeting(id: string): Promise<GreetingQueueItem> {
  const { data } = await api.patch(`/life-events/queue/${id}/approve`);
  return data;
}

export async function skipGreeting(id: string): Promise<GreetingQueueItem> {
  const { data } = await api.patch(`/life-events/queue/${id}/skip`);
  return data;
}

export async function sendGreeting(id: string): Promise<GreetingQueueItem> {
  const { data } = await api.post(`/life-events/queue/${id}/send`);
  return data;
}

export async function bulkSendGreetings(ids?: string[]) {
  const { data } = await api.post('/life-events/queue/bulk-send', { ids });
  return data as { requested: number; sent: number; skipped: number };
}

export async function fetchGreetingTemplates(occasion?: string): Promise<GreetingTemplate[]> {
  const { data } = await api.get('/life-events/templates', { params: clean({ occasion }) });
  return data;
}

export async function createGreetingTemplate(body: {
  occasion: string;
  language?: string;
  body: string;
  active?: boolean;
}): Promise<GreetingTemplate> {
  const { data } = await api.post('/life-events/templates', body);
  return data;
}

export async function updateGreetingTemplate(
  id: string,
  body: { occasion?: string; language?: string; body?: string; active?: boolean },
): Promise<GreetingTemplate> {
  const { data } = await api.patch(`/life-events/templates/${id}`, body);
  return data;
}

export async function deleteGreetingTemplate(id: string) {
  const { data } = await api.delete(`/life-events/templates/${id}`);
  return data;
}

export async function fetchCondolences(
  filters: Record<string, unknown> = {},
): Promise<Paginated<CondolenceLog>> {
  const { data } = await api.get('/life-events/condolences', { params: clean(filters) });
  return data;
}

export async function createCondolence(body: {
  citizenId?: string;
  name: string;
  date?: string;
  notes?: string;
  mobile?: string;
}): Promise<CondolenceLog> {
  const { data } = await api.post('/life-events/condolences', body);
  return data;
}

export async function updateCondolence(
  id: string,
  body: { name?: string; date?: string; notes?: string },
): Promise<CondolenceLog> {
  const { data } = await api.patch(`/life-events/condolences/${id}`, body);
  return data;
}

export async function deleteCondolence(id: string) {
  const { data } = await api.delete(`/life-events/condolences/${id}`);
  return data;
}
