import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const OPPOSITION_ACTIVITY_TYPES = [
  'Meeting',
  'BoothVisit',
  'Promise',
  'Defection',
  'Rally',
  'Other',
] as const;

export interface OppositionActivity {
  id: string;
  rivalName: string;
  party?: string | null;
  activityType: string;
  description: string;
  headcount?: number | null;
  photoUrl?: string | null;
  occurredAt: string;
  village?: { id: string; name: string } | null;
  mandal?: { id: string; name: string } | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  reportedBy?: { id: string; name: string } | null;
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

export interface VisitSummary {
  villages: number;
  green: number;
  amber: number;
  red: number;
  neverVisited: number;
}

export async function fetchOppositionFeed(
  filters: Record<string, unknown> = {},
): Promise<Paginated<OppositionActivity>> {
  const { data } = await api.get('/ground-intel/opposition', { params: clean({ limit: 20, ...filters }) });
  return data;
}

export async function createOppositionActivity(body: Record<string, unknown>) {
  const { data } = await api.post('/ground-intel/opposition', clean(body));
  return data as OppositionActivity;
}

export async function fetchVisitCoverage(
  mandalId?: string,
): Promise<{ summary: VisitSummary; villages: VisitCoverageRow[] }> {
  const { data } = await api.get('/ground-intel/visit-coverage', { params: clean({ mandalId }) });
  return data;
}

/** Same multipart shape the other mobile uploaders use. */
export async function uploadGroundIntelPhoto(uri: string, name = 'opposition.jpg', mimeType = 'image/jpeg') {
  const fd = new FormData();
  fd.append('file', { uri, name, type: mimeType } as unknown as Blob);
  const { data } = await api.post('/uploads/ground-intel', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { url: string; path: string };
}
