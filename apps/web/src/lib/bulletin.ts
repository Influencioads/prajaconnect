import { api } from './api';

export interface BulletinKpi {
  label: string;
  value: number | string;
  delta?: number;
}

export interface BulletinSection {
  key: string;
  title: string;
  kpis: BulletinKpi[];
  rows?: Record<string, unknown>[];
}

export interface BulletinListItem {
  id: string;
  date: string;
  edition: string;
  status: string;
  pdfUrl?: string | null;
  narrative?: string | null;
  createdAt: string;
}

export interface Bulletin extends BulletinListItem {
  narrativeTe?: string | null;
  sections: BulletinSection[];
  deliveryResult?: Record<string, unknown> | null;
}

export interface BulletinSubscription {
  userId: string;
  scope: string;
  mandalId?: string | null;
  channels?: { push?: boolean; whatsapp?: boolean; email?: boolean } | null;
  sendAtHour: number;
  active: boolean;
}

/** Where each bulletin section deep-links on the web. */
export const BULLETIN_SECTION_LINKS: Record<string, string> = {
  grievances: '/grievances',
  tempIntake: '/temp-grievances',
  attendance: '/attendance',
  d2d: '/d2d',
  events: '/events',
  callCenter: '/call-center',
  tasks: '/activities/tasks',
  schedule: '/leader-office/calendar',
  pr: '/media/pr',
  schemes: '/schemes',
};

export async function fetchBulletins(month?: string, edition?: string): Promise<{ data: BulletinListItem[] }> {
  const params: Record<string, string> = {};
  if (month) params.month = month;
  if (edition) params.edition = edition;
  const { data } = await api.get('/bulletin', { params });
  return data;
}

export async function fetchBulletin(id: string): Promise<Bulletin> {
  const { data } = await api.get(`/bulletin/${id}`);
  return data;
}

export async function runBulletin(body: { date?: string; edition?: string } = {}): Promise<Bulletin> {
  const { data } = await api.post('/bulletin/run', body);
  return data;
}

export async function fetchBulletinConfig(): Promise<{ enabled: boolean }> {
  const { data } = await api.get('/bulletin/config');
  return data;
}

export async function updateBulletinConfig(enabled: boolean): Promise<{ enabled: boolean }> {
  const { data } = await api.put('/bulletin/config', { enabled });
  return data;
}

export async function fetchBulletinSubscription(): Promise<BulletinSubscription> {
  const { data } = await api.get('/bulletin/subscriptions');
  return data;
}

export async function saveBulletinSubscription(body: Partial<BulletinSubscription>): Promise<BulletinSubscription> {
  const { data } = await api.put('/bulletin/subscriptions', body);
  return data;
}

export async function downloadBulletinPdf(id: string): Promise<void> {
  const res = await api.get(`/bulletin/${id}/pdf`, { responseType: 'blob' });
  const disposition = (res.headers['content-disposition'] as string | undefined) ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? 'bulletin.pdf';
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
