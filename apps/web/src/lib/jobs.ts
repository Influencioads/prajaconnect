import { api } from './api';
import type { ApiMeta, Paginated } from './media';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface JobSource {
  id: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
  lastFetchAt?: string | null;
  lastError?: string | null;
  createdAt: string;
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
  source?: { id: string; name: string; url?: string };
  dispatchLogs?: JobDispatchLog[];
}

export interface JobDispatchLog {
  id: string;
  citizenCount: number;
  channels: string[];
  dispatchedBy?: string | null;
  createdAt: string;
}

export interface JobMatches {
  count: number;
  withMobile: number;
  preview: {
    id: string;
    name: string;
    age?: number | null;
    occupation?: string | null;
    mobile?: string | null;
    village?: { name: string } | null;
    mandal?: { name: string } | null;
  }[];
}

export async function fetchJobSources(): Promise<JobSource[]> {
  const { data } = await api.get('/jobs/sources');
  return data;
}

export async function createJobSource(body: { name: string; url: string; type?: string; active?: boolean }) {
  const { data } = await api.post('/jobs/sources', body);
  return data;
}

export async function updateJobSource(id: string, body: { name?: string; url?: string; active?: boolean }) {
  const { data } = await api.patch(`/jobs/sources/${id}`, body);
  return data;
}

export async function deleteJobSource(id: string) {
  const { data } = await api.delete(`/jobs/sources/${id}`);
  return data;
}

export async function testJobSource(url: string) {
  const { data } = await api.post('/jobs/sources/test', { url });
  return data as { ok: boolean; itemCount: number; sampleTitles: string[]; error?: string };
}

export async function fetchJobPostings(filters: Record<string, unknown> = {}): Promise<Paginated<JobPosting>> {
  const { data } = await api.get('/jobs/postings', { params: cleanParams(filters) });
  return data;
}

export async function fetchJobPosting(id: string): Promise<JobPosting> {
  const { data } = await api.get(`/jobs/postings/${id}`);
  return data;
}

export async function updateJobPostingStatus(id: string, status: string) {
  const { data } = await api.patch(`/jobs/postings/${id}/status`, { status });
  return data;
}

export async function fetchJobMatches(id: string): Promise<JobMatches> {
  const { data } = await api.get(`/jobs/${id}/matches`);
  return data;
}

export async function dispatchJob(id: string, channels: string[]) {
  const { data } = await api.post(`/jobs/${id}/dispatch`, { channels });
  return data as { ok: boolean; citizenCount: number; channels: string[]; logId: string };
}

export async function runJobsCycle() {
  const { data } = await api.post('/jobs/run');
  return data as { status: string; postingsNew: number; sourcesChecked: number };
}

export function daysLeft(lastDate?: string | null): { label: string; expired: boolean } | null {
  if (!lastDate) return null;
  const diff = new Date(lastDate).getTime() - Date.now();
  if (diff < 0) return { label: 'Expired', expired: true };
  const days = Math.ceil(diff / 86400000);
  return { label: days === 0 ? 'Today' : `${days}d left`, expired: false };
}

export type { ApiMeta };
