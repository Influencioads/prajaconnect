import { api } from './api';

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: ApiMeta;
}

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface MediaDashboard {
  totalNews: number;
  pendingAttacks: number;
  draftResponses: number;
  reputationScore: number;
  clippingCount: number;
  mentionCount: number;
  openPrAlerts?: number;
  slaBreaches?: number;
  recentNews: NewsArticle[];
  recentAttacks: OppositionAttack[];
}

export interface NewsArticle {
  id: string;
  title: string;
  source?: string | null;
  url?: string | null;
  sentiment?: string | null;
  importanceScore?: number | null;
  aiSeverity?: string | null;
  processedAt?: string | null;
  contentHash?: string | null;
  summary?: string | null;
  createdAt: string;
  mentions?: LeaderMention[];
  _count?: { mentions: number };
}

export interface LeaderMention {
  id: string;
  articleId: string;
  leaderName: string;
  sentiment?: string | null;
  article?: { id: string; title: string; source?: string | null };
}

export interface PressClipping {
  id: string;
  title: string;
  clipDate: string;
  fileUrl?: string | null;
  createdAt: string;
}

export interface OppositionAttack {
  id: string;
  title: string;
  description?: string | null;
  responseStatus: string;
  createdAt: string;
  responses?: MediaResponse[];
  _count?: { responses: number };
}

export interface MediaResponse {
  id: string;
  attackId: string;
  content: string;
  status: string;
  createdAt: string;
  attack?: { id: string; title: string; description?: string | null };
}

export interface ReputationSnapshot {
  id: string;
  score: number;
  date: string;
}

export interface SocialListeningEntry {
  id: string;
  platform: string;
  keyword: string;
  notes?: string | null;
  createdAt: string;
}

export const MEDIA_RESPONSE_STATUSES = ['Draft', 'PendingApproval', 'Approved', 'Published'] as const;

export async function fetchMediaDashboard(): Promise<MediaDashboard> {
  const { data } = await api.get('/media/dashboard');
  return data;
}

export async function fetchNews(filters: Record<string, unknown> = {}): Promise<Paginated<NewsArticle>> {
  const { data } = await api.get('/media/news', { params: cleanParams(filters) });
  return data;
}

export async function fetchNewsArticle(id: string): Promise<NewsArticle> {
  const { data } = await api.get(`/media/news/${id}`);
  return data;
}

export async function createNews(body: { title: string; source?: string; url?: string; sentiment?: string }) {
  const { data } = await api.post('/media/news', body);
  return data;
}

export async function fetchClippings(filters: Record<string, unknown> = {}): Promise<Paginated<PressClipping>> {
  const { data } = await api.get('/media/clippings', { params: cleanParams(filters) });
  return data;
}

export async function createClipping(body: { title: string; clipDate?: string; fileUrl?: string }) {
  const { data } = await api.post('/media/clippings', body);
  return data;
}

export async function deleteClipping(id: string) {
  const { data } = await api.delete(`/media/clippings/${id}`);
  return data;
}

export async function fetchMentions(filters: Record<string, unknown> = {}): Promise<Paginated<LeaderMention>> {
  const { data } = await api.get('/media/mentions', { params: cleanParams(filters) });
  return data;
}

export async function fetchAttacks(filters: Record<string, unknown> = {}): Promise<Paginated<OppositionAttack>> {
  const { data } = await api.get('/media/attacks', { params: cleanParams(filters) });
  return data;
}

export async function fetchAttack(id: string): Promise<OppositionAttack> {
  const { data } = await api.get(`/media/attacks/${id}`);
  return data;
}

export async function createAttack(body: { title: string; description?: string }) {
  const { data } = await api.post('/media/attacks', body);
  return data;
}

export async function fetchMediaResponses(filters: Record<string, unknown> = {}): Promise<Paginated<MediaResponse>> {
  const { data } = await api.get('/media/responses', { params: cleanParams(filters) });
  return data;
}

export async function createMediaResponse(body: { attackId: string; content: string; status?: string }) {
  const { data } = await api.post('/media/responses', body);
  return data;
}

export async function approveMediaResponse(id: string) {
  const { data } = await api.patch(`/media/responses/${id}/approve`);
  return data;
}

export async function publishMediaResponse(id: string) {
  const { data } = await api.patch(`/media/responses/${id}/publish`);
  return data;
}

export async function fetchReputationSnapshots(filters: Record<string, unknown> = {}): Promise<Paginated<ReputationSnapshot>> {
  const { data } = await api.get('/media/reputation', { params: cleanParams(filters) });
  return data;
}

export async function computeReputationScore() {
  const { data } = await api.post('/media/reputation/compute');
  return data;
}

export async function fetchSocialListening(filters: Record<string, unknown> = {}): Promise<Paginated<SocialListeningEntry>> {
  const { data } = await api.get('/media/social-listening', { params: cleanParams(filters) });
  return data;
}

export async function createSocialListening(body: { platform: string; keyword: string; notes?: string }) {
  const { data } = await api.post('/media/social-listening', body);
  return data;
}

export async function deleteSocialListening(id: string) {
  const { data } = await api.delete(`/media/social-listening/${id}`);
  return data;
}

export async function downloadMediaReport(type: string) {
  const response = await api.get(`/media/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `media-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
