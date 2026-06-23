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

export interface CrisisDashboard {
  openIssues: number;
  activeIssues: number;
  bySeverity: Record<string, number>;
  escalationCount: number;
  rrtCount: number;
  recentIssues: CrisisIssue[];
  recentTimeline: CrisisTimelineEntry[];
}

export interface CrisisIssue {
  id: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  villageId?: string | null;
  mandalId?: string | null;
  village?: { id: string; name: string } | null;
  mandal?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  timeline?: CrisisTimelineEntry[];
  escalations?: CrisisEscalation[];
  responses?: EmergencyResponse[];
  _count?: { timeline: number; escalations: number; responses: number };
}

export interface CrisisTimelineEntry {
  id: string;
  issueId: string;
  note: string;
  createdAt: string;
  user?: { id: string; name: string } | null;
  issue?: { id: string; title: string; severity?: string };
}

export interface CrisisEscalation {
  id: string;
  issueId: string;
  level: number;
  assignedToId?: string | null;
  createdAt: string;
  issue?: { id: string; title: string; severity?: string };
  assignedTo?: { id: string; name: string } | null;
}

export interface EmergencyResponse {
  id: string;
  issueId: string;
  teamName: string;
  status: string;
  createdAt: string;
  issue?: { id: string; title: string; severity?: string };
  assignments?: RapidResponseAssignment[];
  _count?: { assignments: number };
}

export interface RapidResponseAssignment {
  id: string;
  responseId: string;
  cadreId: string;
  cadre?: { id: string; name: string };
}

export interface HeatmapRow {
  villageId?: string;
  villageName?: string;
  mandalId?: string;
  mandalName?: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export const CRISIS_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const CRISIS_STATUSES = ['Open', 'Active', 'Resolved', 'Closed'] as const;

export async function fetchCrisisDashboard(): Promise<CrisisDashboard> {
  const { data } = await api.get('/crisis/dashboard');
  return data;
}

export async function fetchCrisisIssues(filters: Record<string, unknown> = {}): Promise<Paginated<CrisisIssue>> {
  const { data } = await api.get('/crisis/issues', { params: cleanParams(filters) });
  return data;
}

export async function fetchCrisisIssue(id: string): Promise<CrisisIssue> {
  const { data } = await api.get(`/crisis/issues/${id}`);
  return data;
}

export async function createCrisisIssue(body: {
  title: string;
  description?: string;
  severity?: string;
  villageId?: string;
  mandalId?: string;
}) {
  const { data } = await api.post('/crisis/issues', body);
  return data;
}

export async function updateCrisisIssue(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/crisis/issues/${id}`, body);
  return data;
}

export async function addCrisisTimelineEntry(issueId: string, note: string) {
  const { data } = await api.post(`/crisis/issues/${issueId}/timeline`, { note });
  return data;
}

export async function fetchCrisisEscalations(filters: Record<string, unknown> = {}): Promise<Paginated<CrisisEscalation>> {
  const { data } = await api.get('/crisis/escalations', { params: cleanParams(filters) });
  return data;
}

export async function createCrisisEscalation(body: { issueId: string; level?: number; assignedToId?: string }) {
  const { data } = await api.post('/crisis/escalations', body);
  return data;
}

export async function fetchEmergencyResponses(filters: Record<string, unknown> = {}): Promise<Paginated<EmergencyResponse>> {
  const { data } = await api.get('/crisis/responses', { params: cleanParams(filters) });
  return data;
}

export async function createEmergencyResponse(body: { issueId: string; teamName: string; status?: string }) {
  const { data } = await api.post('/crisis/responses', body);
  return data;
}

export async function createRrtAssignment(responseId: string, cadreId: string) {
  const { data } = await api.post(`/crisis/responses/${responseId}/assignments`, { cadreId });
  return data;
}

export async function fetchHeatmapVillages(): Promise<HeatmapRow[]> {
  const { data } = await api.get('/crisis/heatmap/villages');
  return data;
}

export async function fetchHeatmapMandals(): Promise<HeatmapRow[]> {
  const { data } = await api.get('/crisis/heatmap/mandals');
  return data;
}

export async function downloadCrisisReport(type: string) {
  const response = await api.get(`/crisis/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `crisis-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
