import { api } from './api';
import type { Paginated } from './crm';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const INFLUENCE_PERSON_TYPES = [
  'Influencer',
  'ImpLeader',
  'CommitteeMember',
  'Observer',
  'PressContact',
] as const;
export const INFLUENCE_RELATIONS = ['Supports', 'Neutral', 'Rival'] as const;
export const OPPOSITION_ACTIVITY_TYPES = [
  'Meeting',
  'BoothVisit',
  'Promise',
  'Defection',
  'Rally',
  'Other',
] as const;

export interface InfluenceLink {
  id: string;
  personType: string;
  personId: string;
  boothId?: string | null;
  villageId?: string | null;
  community?: string | null;
  strength: number;
  relation: string;
  notes?: string | null;
  createdAt: string;
  booth?: { id: string; number: string; name?: string | null } | null;
  village?: { id: string; name: string; mandal?: { id: string; name: string } | null } | null;
}

export interface BoothCoverageRow {
  boothId: string;
  boothNumber: string;
  boothName?: string | null;
  voterCount: number;
  villageId?: string | null;
  villageName?: string | null;
  mandalId?: string | null;
  mandalName?: string | null;
  totalLinks: number;
  friendlyLinks: number;
  neutralLinks: number;
  rivalLinks: number;
  avgFriendlyStrength: number;
  communitiesCovered: string[];
  communitiesUncovered: string[];
  strengthLabel?: string | null;
  supporterPct?: number | null;
  priorityBoothScore: number;
  zeroFriendly: boolean;
  urgent: boolean;
}

export interface CoverageResponse {
  communityUniverse: string[];
  totals: {
    booths: number;
    boothsWithFriendlyLink: number;
    zeroFriendlyBooths: number;
    urgentBooths: number;
    totalLinks: number;
  };
  booths: BoothCoverageRow[];
  urgent: BoothCoverageRow[];
}

export interface OppositionActivity {
  id: string;
  rivalName: string;
  party?: string | null;
  activityType: string;
  description: string;
  headcount?: number | null;
  photoUrl?: string | null;
  occurredAt: string;
  createdAt: string;
  village?: { id: string; name: string } | null;
  mandal?: { id: string; name: string } | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  reportedBy?: { id: string; name: string } | null;
}

export interface OppositionHeatRow {
  mandalId: string | null;
  mandalName: string;
  last30: number;
  prev30: number;
  headcount30: number;
  byType: Record<string, number>;
  trend: number;
  trendPct: number;
}

export interface OppositionHeat {
  windowDays: number;
  totals: { last30: number; prev30: number; headcount30: number; byType: Record<string, number> };
  mandals: OppositionHeatRow[];
}

export interface VisitCoverageRow {
  villageId: string;
  villageName: string;
  mandalId?: string | null;
  mandalName?: string | null;
  lastVisitAt: string | null;
  lastVisitSource: string | null;
  daysSince: number | null;
  bucket: 'green' | 'amber' | 'red';
}

export interface VisitPlanRow extends VisitCoverageRow {
  pending: {
    openGrievances: number;
    activeCamps: number;
    pendingSchemeMatches: number;
    totalBooths: number;
    uncoveredBooths: number;
  };
  pendingTotal: number;
}

export interface VisitSummary {
  villages: number;
  green: number;
  amber: number;
  red: number;
  neverVisited: number;
}

export async function fetchInfluenceLinks(
  filters: Record<string, unknown> = {},
): Promise<Paginated<InfluenceLink>> {
  const { data } = await api.get('/ground-intel/links', { params: cleanParams(filters) });
  return data;
}

export async function createInfluenceLink(body: Record<string, unknown>) {
  const { data } = await api.post('/ground-intel/links', body);
  return data as InfluenceLink;
}

export async function updateInfluenceLink(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/ground-intel/links/${id}`, body);
  return data as InfluenceLink;
}

export async function deleteInfluenceLink(id: string) {
  const { data } = await api.delete(`/ground-intel/links/${id}`);
  return data;
}

export async function fetchCoverage(filters: Record<string, unknown> = {}): Promise<CoverageResponse> {
  const { data } = await api.get('/ground-intel/coverage', { params: cleanParams(filters) });
  return data;
}

export async function fetchOppositionFeed(
  filters: Record<string, unknown> = {},
): Promise<Paginated<OppositionActivity>> {
  const { data } = await api.get('/ground-intel/opposition', { params: cleanParams(filters) });
  return data;
}

export async function createOppositionActivity(body: Record<string, unknown>) {
  const { data } = await api.post('/ground-intel/opposition', body);
  return data as OppositionActivity;
}

export async function deleteOppositionActivity(id: string) {
  const { data } = await api.delete(`/ground-intel/opposition/${id}`);
  return data;
}

export async function fetchOppositionHeat(mandalId?: string): Promise<OppositionHeat> {
  const { data } = await api.get('/ground-intel/opposition/heat', { params: cleanParams({ mandalId }) });
  return data;
}

export async function fetchVisitCoverage(
  mandalId?: string,
): Promise<{ summary: VisitSummary; villages: VisitCoverageRow[] }> {
  const { data } = await api.get('/ground-intel/visit-coverage', { params: cleanParams({ mandalId }) });
  return data;
}

export async function fetchVisitPlan(
  mandalId?: string,
): Promise<{ summary: VisitSummary; villages: VisitPlanRow[] }> {
  const { data } = await api.get('/ground-intel/visit-plan', { params: cleanParams({ mandalId }) });
  return data;
}
