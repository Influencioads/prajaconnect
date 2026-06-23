import { api } from './api';
import type { ApiMeta, Paginated } from './media';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface PrDashboard {
  openAlerts: number;
  criticalAlerts: number;
  slaBreaches: number;
  cronEnabled: boolean;
  nextScheduledRun: string;
  latestReport: PrReport | null;
  lastRun: PrIngestionRun | null;
  openAlertsList: PrAlert[];
}

export interface PrReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  summary?: string | null;
  mustCoverJson?: MustCoverItem[] | null;
  negativePrJson?: NegativePrItem[] | null;
  statsJson?: Record<string, unknown> | null;
  generatedBy: string;
  createdAt: string;
}

export interface MustCoverItem {
  articleId: string;
  title: string;
  reason: string;
  importanceScore: number;
}

export interface NegativePrItem {
  articleId: string;
  title: string;
  action: string;
}

export interface PrAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  body?: string | null;
  status: string;
  linkedArticleId?: string | null;
  linkedAttackId?: string | null;
  linkedArticle?: { id: string; title: string; url?: string | null };
  linkedAttack?: { id: string; title: string };
  acknowledgedAt?: string | null;
  acknowledgedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  language: string;
  enabled: boolean;
  lastFetchedAt?: string | null;
  lastError?: string | null;
  createdAt: string;
}

export interface PrIngestionRun {
  id: string;
  status: string;
  sourcesChecked: number;
  articlesFetched: number;
  articlesNew: number;
  errors?: unknown;
  startedAt: string;
  finishedAt?: string | null;
}

export async function fetchPrDashboard(): Promise<PrDashboard> {
  const { data } = await api.get('/pr-management/dashboard');
  return data;
}

export async function fetchPrReports(filters: Record<string, unknown> = {}): Promise<Paginated<PrReport>> {
  const { data } = await api.get('/pr-management/reports', { params: cleanParams(filters) });
  return data;
}

export async function fetchPrReport(id: string): Promise<PrReport> {
  const { data } = await api.get(`/pr-management/reports/${id}`);
  return data;
}

export async function fetchPrAlerts(filters: Record<string, unknown> = {}): Promise<Paginated<PrAlert>> {
  const { data } = await api.get('/pr-management/alerts', { params: cleanParams(filters) });
  return data;
}

export async function acknowledgePrAlert(id: string) {
  const { data } = await api.patch(`/pr-management/alerts/${id}/acknowledge`);
  return data;
}

export async function resolvePrAlert(id: string) {
  const { data } = await api.patch(`/pr-management/alerts/${id}/resolve`);
  return data;
}

export async function fetchNewsSources(): Promise<NewsSource[]> {
  const { data } = await api.get('/pr-management/sources');
  return data;
}

export async function createNewsSource(body: { name: string; url: string; language?: string; enabled?: boolean }) {
  const { data } = await api.post('/pr-management/sources', body);
  return data;
}

export async function updateNewsSource(
  id: string,
  body: { name?: string; url?: string; language?: string; enabled?: boolean },
) {
  const { data } = await api.patch(`/pr-management/sources/${id}`, body);
  return data;
}

export async function deleteNewsSource(id: string) {
  const { data } = await api.delete(`/pr-management/sources/${id}`);
  return data;
}

export async function testNewsSource(url: string) {
  const { data } = await api.post('/pr-management/sources/test', { url });
  return data as { ok: boolean; itemCount: number; sampleTitles: string[]; error?: string };
}

export async function runPrCycle() {
  const { data } = await api.post('/pr-management/run');
  return data as { runId: string; status: string };
}

export async function fetchPrRuns(filters: Record<string, unknown> = {}): Promise<Paginated<PrIngestionRun>> {
  const { data } = await api.get('/pr-management/runs', { params: cleanParams(filters) });
  return data;
}

export type { ApiMeta };
