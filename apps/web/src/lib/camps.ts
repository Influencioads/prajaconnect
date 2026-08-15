import { api } from './api';
import type { ApiMeta } from './crm';

// ===== Scheme matches =====
export interface SchemeMatchItem {
  id: string;
  schemeId: string;
  score: number;
  matchedOn: { criteria?: string[]; reasons?: string[] } | null;
  status: string;
  createdAt: string;
  citizen: {
    id: string;
    name: string;
    mobile?: string | null;
    age?: number | null;
    occupation?: string | null;
    village?: { id: string; name: string } | null;
    mandal?: { id: string; name: string } | null;
    booth?: { id: string; number: string } | null;
  };
  assignedCadre?: { id: string; name: string; mobile?: string | null } | null;
  scheme?: { id: string; name: string; code: string; benefitAmount?: number | null };
}

export interface MatchesResponse {
  data: SchemeMatchItem[];
  meta: ApiMeta;
  byStatus: { status: string; count: number }[];
}

export const MATCH_STATUSES = ['Suggested', 'Contacted', 'Applied', 'Enrolled', 'NotEligible'];

export async function fetchSchemeMatches(
  schemeId: string,
  filters: { status?: string; mandalId?: string; villageId?: string; page?: number; limit?: number },
): Promise<MatchesResponse> {
  const { data } = await api.get(`/schemes/${schemeId}/matches`, { params: filters });
  return data;
}

export async function updateSchemeMatch(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/scheme-matches/${id}`, payload)).data;
}

export async function runSchemeMatcher() {
  return (await api.post('/schemes/matcher/run')).data;
}

export async function downloadMatchesCsv(schemeId: string, filters: { status?: string; mandalId?: string; villageId?: string }) {
  const response = await api.get(`/schemes/${schemeId}/matches/export`, {
    params: filters,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scheme-matches.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// ===== Service camps =====
export interface CampListItem {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  targetSchemes: string[];
  notes?: string | null;
  village?: { id: string; name: string } | null;
  mandal?: { id: string; name: string } | null;
  _count: { registrations: number };
}

export interface CampRegistrationItem {
  id: string;
  source: string;
  token: number;
  purpose?: string | null;
  outcome?: string | null;
  resolvedOnSpot: boolean;
  createdAt: string;
  citizen: {
    id: string;
    name: string;
    mobile?: string | null;
    village?: { id: string; name: string } | null;
    booth?: { id: string; number: string } | null;
  };
}

export interface CampDetail extends CampListItem {
  registrations: CampRegistrationItem[];
  schemes: { id: string; name: string; code: string }[];
}

export interface CampStats {
  total: number;
  upcoming: number;
  completed: number;
  registrations: number;
  resolved: number;
}

export interface CampSummary {
  registered: number;
  preRegistered: number;
  walkIn: number;
  attended: number;
  resolved: number;
  outcomes: { outcome: string | null; count: number }[];
}

export const CAMP_STATUSES = ['Planned', 'Ongoing', 'Completed', 'Cancelled'];
export const CAMP_OUTCOMES = ['Applied', 'Enrolled', 'NotEligible', 'InfoGiven', 'Referred'];

export async function fetchCamps(filters: {
  search?: string;
  status?: string;
  mandalId?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: CampListItem[]; meta: ApiMeta }> {
  const { data } = await api.get('/camps', { params: filters });
  return data;
}

export async function fetchCampStats(): Promise<CampStats> {
  const { data } = await api.get('/camps/stats');
  return data;
}

export async function fetchCampDetail(id: string): Promise<CampDetail> {
  const { data } = await api.get(`/camps/${id}`);
  return data;
}

export async function fetchCampSummary(id: string): Promise<CampSummary> {
  const { data } = await api.get(`/camps/${id}/summary`);
  return data;
}

export async function createCamp(payload: Record<string, unknown>) {
  return (await api.post('/camps', payload)).data;
}

export async function updateCamp(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/camps/${id}`, payload)).data;
}

export async function preregisterMatches(id: string, schemeIds: string[]) {
  return (await api.post(`/camps/${id}/preregister-matches`, { schemeIds })).data;
}

export async function registerWalkIn(id: string, citizenId: string, purpose?: string) {
  return (await api.post(`/camps/${id}/register`, { citizenId, purpose })).data;
}

export async function updateCampRegistration(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/camps/registrations/${id}`, payload)).data;
}

export async function finalizeCamp(id: string) {
  return (await api.post(`/camps/${id}/finalize`)).data;
}
