import { api } from './api';
import { API_URL } from './config';

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
}

/** Where each bulletin section deep-links on mobile. */
export const BULLETIN_SECTION_ROUTES: Record<string, string> = {
  grievances: '/grievances',
  tempIntake: '/temp-grievances',
  attendance: '/attendance',
  d2d: '/d2d',
  events: '/events',
  callCenter: '/call-center/log',
  tasks: '/activities/tasks',
  schedule: '/leader-office/calendar',
  pr: '/media',
  schemes: '/eligibility',
};

export async function fetchBulletins(month?: string): Promise<{ data: BulletinListItem[] }> {
  const { data } = await api.get('/bulletin', { params: month ? { month } : {} });
  return data;
}

export async function fetchBulletin(id: string): Promise<Bulletin> {
  const { data } = await api.get(`/bulletin/${id}`);
  return data;
}

/** Public URL of the stored bulletin PDF (served statically outside /api). */
export function bulletinPdfUrl(b: { pdfUrl?: string | null }): string | null {
  if (!b.pdfUrl) return null;
  return `${API_URL.replace(/\/api\/?$/, '')}${b.pdfUrl}`;
}
