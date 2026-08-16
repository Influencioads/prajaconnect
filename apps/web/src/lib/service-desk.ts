import api from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const SERVICE_REQUEST_TYPES = [
  'IncomeCertificate',
  'CasteCertificate',
  'Pension',
  'JobCard',
  'Transfer',
  'LandRecord',
  'Other',
] as const;

export const SERVICE_REQUEST_STATUSES = [
  'Received',
  'Forwarded',
  'InProcess',
  'Completed',
  'Rejected',
] as const;

export interface ServiceRequestUpdate {
  id: string;
  status: string;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  refNo: string;
  applicantName: string;
  mobile: string;
  type: string;
  details: string;
  status: string;
  outcome?: string | null;
  slaDueAt?: string | null;
  createdAt: string;
  updatedAt: string;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
  village?: { id: string; name: string } | null;
  department?: { id: string; name: string; slaHours: number } | null;
  assignedTo?: { id: string; name: string } | null;
  updates?: ServiceRequestUpdate[];
  daysRemaining?: number | null;
  daysOverdue?: number;
  slaStatus?: string;
}

export interface ServiceDeskStats {
  total: number;
  overdue: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byVillage: { villageId: string | null; name: string; count: number }[];
}

export interface VolunteerProfile {
  id: string;
  skills: string[];
  totalHours: number;
  points: number;
  active: boolean;
  createdAt: string;
  registration: { id: string; name: string; mobile: string; village?: string | null; status: string };
  user?: { id: string; name: string } | null;
}

export interface LeaderboardRow {
  rank: number;
  id: string;
  name: string;
  village?: string | null;
  skills: string[];
  totalHours: number;
  points: number;
}

export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function fetchServiceRequests(params: Record<string, unknown> = {}): Promise<Paged<ServiceRequest>> {
  const { data } = await api.get('/service-requests', { params: cleanParams(params) });
  return data;
}

export async function fetchServiceRequest(id: string): Promise<ServiceRequest> {
  const { data } = await api.get(`/service-requests/${id}`);
  return data;
}

export async function fetchServiceDeskStats(): Promise<ServiceDeskStats> {
  const { data } = await api.get('/service-requests/stats');
  return data;
}

export interface ServiceDeskOptions {
  departments: { id: string; name: string; slaHours: number }[];
  villages: { id: string; name: string; mandal?: { id: string; name: string } | null }[];
}

export async function fetchServiceDeskOptions(): Promise<ServiceDeskOptions> {
  const { data } = await api.get('/service-requests/options');
  return data;
}

export async function createServiceRequest(body: Record<string, unknown>): Promise<ServiceRequest> {
  const { data } = await api.post('/service-requests', body);
  return data;
}

export async function changeServiceRequestStatus(
  id: string,
  body: { status: string; notes?: string; outcome?: string },
): Promise<ServiceRequest> {
  const { data } = await api.post(`/service-requests/${id}/status`, body);
  return data;
}

export async function forwardServiceRequest(
  id: string,
  body: { departmentId: string; notes?: string },
): Promise<ServiceRequest> {
  const { data } = await api.post(`/service-requests/${id}/forward`, body);
  return data;
}

export async function fetchVolunteerProfiles(params: Record<string, unknown> = {}): Promise<Paged<VolunteerProfile>> {
  const { data } = await api.get('/service-requests/volunteers', { params: cleanParams(params) });
  return data;
}

export async function fetchVolunteerLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const { data } = await api.get('/service-requests/volunteers/leaderboard', { params: { limit } });
  return data;
}

export async function assignVolunteerTask(
  id: string,
  body: { title: string; description?: string; dueAt?: string },
) {
  const { data } = await api.post(`/service-requests/volunteers/${id}/assign-task`, body);
  return data as { assignedToUser: boolean; note?: string };
}

export async function logVolunteerHours(id: string, body: { hours: number; note?: string }) {
  const { data } = await api.post(`/service-requests/volunteers/${id}/log-hours`, body);
  return data as VolunteerProfile;
}

export async function updateVolunteerProfile(id: string, body: { skills?: string[]; active?: boolean }) {
  const { data } = await api.patch(`/service-requests/volunteers/${id}`, body);
  return data as VolunteerProfile;
}

export interface VillageFeed {
  village: { id: string; name: string; mandal?: { id: string; name: string } | null };
  promiseUpdates: {
    id: string;
    note: string;
    createdAt: string;
    promise: { id: string; title: string; workStatus: string; completionPct: number };
  }[];
  projects: {
    id: string;
    name: string;
    category?: string | null;
    status: string;
    progressPct: number;
    budget: number;
    spent: number;
    expectedEndDate?: string | null;
  }[];
  events: { id: string; title: string; type: string; startAt: string; venue?: string | null }[];
  serviceCamps: { id: string; title?: string; name?: string; startAt?: string; venue?: string }[];
  fundWorks: { id: string; title?: string; name?: string; amount?: number; status?: string }[];
}

export async function fetchVillageFeed(villageId: string): Promise<VillageFeed> {
  const { data } = await api.get(`/public/village/${villageId}/feed`);
  return data;
}
