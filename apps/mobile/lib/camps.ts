import { api } from './api';

export const MATCH_STATUSES = ['Suggested', 'Contacted', 'Applied', 'Enrolled', 'NotEligible'];
export const CAMP_OUTCOMES = ['Applied', 'Enrolled', 'NotEligible', 'InfoGiven', 'Referred'];

export interface CampListItem {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  targetSchemes: string[];
  village?: { name: string } | null;
  mandal?: { name: string } | null;
  _count: { registrations: number };
}

export interface CampRegistrationItem {
  id: string;
  source: string;
  token: number;
  purpose?: string | null;
  outcome?: string | null;
  resolvedOnSpot: boolean;
  citizen: { id: string; name: string; mobile?: string | null };
}

export interface CampDetail extends CampListItem {
  registrations: CampRegistrationItem[];
  schemes: { id: string; name: string; code: string }[];
}

export interface WorklistMatch {
  id: string;
  score: number;
  status: string;
  citizen: {
    id: string;
    name: string;
    mobile?: string | null;
    village?: { name: string } | null;
    booth?: { number: string } | null;
  };
  scheme: { id: string; name: string; code: string; benefitAmount?: number | null };
}

export async function fetchUpcomingCamps(): Promise<CampListItem[]> {
  const { data } = await api.get('/camps', { params: { upcoming: true, limit: 50 } });
  return data.data;
}

export async function fetchCamp(id: string): Promise<CampDetail> {
  const { data } = await api.get(`/camps/${id}`);
  return data;
}

export async function registerWalkIn(campId: string, citizenId: string, purpose?: string): Promise<CampRegistrationItem> {
  const { data } = await api.post(`/camps/${campId}/register`, { citizenId, purpose });
  return data;
}

export async function updateRegistration(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/camps/registrations/${id}`, payload)).data;
}

export async function fetchWorklist(status?: string): Promise<{ cadre: { id: string } | null; data: WorklistMatch[] }> {
  const { data } = await api.get('/scheme-matches/worklist', { params: status ? { status } : {} });
  return data;
}

export async function updateMatchStatus(id: string, status: string) {
  return (await api.patch(`/scheme-matches/${id}`, { status })).data;
}
