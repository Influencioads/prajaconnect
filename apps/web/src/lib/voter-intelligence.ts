import api from './api';

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

export interface VoterDashboard {
  totalProfiles: number;
  supporters: number;
  neutrals: number;
  opponents: number;
  swings: number;
  keyVoters: number;
  influencers: number;
  pendingDuplicates: number;
  bySegment: Array<{ segmentId: string | null; segment: { name: string; color: string }; count: number }>;
  topPriorityBooths: Array<{
    id: string;
    supporterPct: number;
    strengthLabel: string;
    priorityBoothScore: number;
    booth: { id: string; number: string; name: string | null };
  }>;
}

export interface VoterProfile {
  id: string;
  citizenId: string;
  preference: string;
  isKeyVoter: boolean;
  isInfluencer: boolean;
  isSwing: boolean;
  priorityScore: number;
  segmentId?: string | null;
  notes?: string | null;
  citizen: {
    id: string;
    name: string;
    mobile?: string | null;
    voterId?: string | null;
    booth?: { number: string; name?: string | null } | null;
    village?: { name: string } | null;
    mandal?: { name: string } | null;
    family?: { headName: string } | null;
  };
  segment?: { id: string; name: string; color: string } | null;
}

export async function fetchVoterDashboard(): Promise<VoterDashboard> {
  const { data } = await api.get('/voter-intelligence/dashboard');
  return data;
}

export async function fetchVoterProfiles(filters: Record<string, unknown> = {}): Promise<Paginated<VoterProfile>> {
  const { data } = await api.get('/voter-intelligence/profiles', { params: cleanParams(filters) });
  return data;
}

export async function fetchVoterProfile(id: string) {
  const { data } = await api.get(`/voter-intelligence/profiles/${id}`);
  return data;
}

export async function updateVoterProfile(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/voter-intelligence/profiles/${id}`, body);
  return data;
}

export async function createVoterProfile(body: Record<string, unknown>) {
  const { data } = await api.post('/voter-intelligence/profiles', body);
  return data;
}

export async function fetchVoterSegments() {
  const { data } = await api.get('/voter-intelligence/segments');
  return data;
}

export async function fetchVoterFamilies(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/voter-intelligence/families', { params: cleanParams(filters) });
  return data;
}

export async function fetchVoterBoothStrength(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/voter-intelligence/booths', { params: cleanParams(filters) });
  return data;
}

export async function fetchVoterDuplicates(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/voter-intelligence/duplicates', { params: cleanParams(filters) });
  return data;
}

export async function detectVoterDuplicates() {
  const { data } = await api.post('/voter-intelligence/duplicates/detect');
  return data;
}

export async function reviewVoterDuplicate(id: string, status: string) {
  const { data } = await api.patch(`/voter-intelligence/duplicates/${id}`, { status });
  return data;
}

export async function syncVoterFromSources() {
  const { data } = await api.post('/voter-intelligence/sync-from-sources');
  return data;
}

export async function downloadVoterReport(type: string) {
  const response = await api.get(`/voter-intelligence/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `voter-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function createVoterSegment(body: { name: string; description?: string; color?: string }) {
  const { data } = await api.post('/voter-intelligence/segments', body);
  return data;
}

export async function updateVoterSegment(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/voter-intelligence/segments/${id}`, body);
  return data;
}

export async function deleteVoterSegment(id: string) {
  const { data } = await api.delete(`/voter-intelligence/segments/${id}`);
  return data;
}

export async function importVoterRoll(fileName: string, entries: Array<Record<string, unknown>>) {
  const { data } = await api.post('/voter-intelligence/import', { fileName, entries });
  return data;
}
