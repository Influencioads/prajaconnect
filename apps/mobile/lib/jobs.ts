import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface JobPosting {
  id: string;
  title: string;
  organization?: string | null;
  url?: string | null;
  summary?: string | null;
  qualification?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  lastDate?: string | null;
  district?: string | null;
  aiExtracted: boolean;
  status: string;
  createdAt: string;
  source?: { id: string; name: string };
}

export interface JobMatches {
  count: number;
  withMobile: number;
  preview: { id: string; name: string; age?: number | null; occupation?: string | null }[];
}

export async function fetchJobPostings(filters: Record<string, unknown> = {}): Promise<Paginated<JobPosting>> {
  const { data } = await api.get('/jobs/postings', { params: clean(filters) });
  return data;
}

export async function fetchJobPosting(id: string): Promise<JobPosting> {
  const { data } = await api.get(`/jobs/postings/${id}`);
  return data;
}

export async function fetchJobMatches(id: string): Promise<JobMatches> {
  const { data } = await api.get(`/jobs/${id}/matches`);
  return data;
}

export async function dispatchJob(id: string, channels: string[]) {
  const { data } = await api.post(`/jobs/${id}/dispatch`, { channels });
  return data as { ok: boolean; citizenCount: number; channels: string[] };
}

export function daysLeft(lastDate?: string | null): string | null {
  if (!lastDate) return null;
  const diff = new Date(lastDate).getTime() - Date.now();
  if (diff < 0) return 'Expired';
  const days = Math.ceil(diff / 86400000);
  return days === 0 ? 'Today' : `${days}d left`;
}
