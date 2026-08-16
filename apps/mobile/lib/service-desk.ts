import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
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
  village?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  daysOverdue?: number;
  slaStatus?: string;
}

export interface ServiceDeskOptions {
  departments: { id: string; name: string; slaHours: number }[];
  villages: { id: string; name: string }[];
}

export async function fetchServiceRequests(params: Record<string, unknown> = {}): Promise<Paginated<ServiceRequest>> {
  const { data } = await api.get('/service-requests', { params: clean(params) });
  return data;
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
