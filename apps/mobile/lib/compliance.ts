import { api } from './api';
import type { Paginated } from './crm';

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface PermissionRequest {
  id: string;
  type: string;
  title: string;
  status: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  documents?: { id: string; fileUrl: string; fileName?: string | null }[];
}

export interface ComplianceDashboard {
  pendingPermissions: number;
  approvedPermissions: number;
  openAlerts: number;
  openNotices: number;
  documentCount: number;
  checklistStats: { id: string; name: string; completed: number; total: number; completionPct: number }[];
  recentRequests: PermissionRequest[];
}

export async function fetchComplianceDashboard(): Promise<ComplianceDashboard> {
  const { data } = await api.get('/compliance/dashboard');
  return data;
}

export async function fetchPermissionRequests(
  filters: Record<string, unknown> = {},
): Promise<Paginated<PermissionRequest>> {
  const { data } = await api.get('/compliance/permission-requests', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function fetchPermissionRequest(id: string): Promise<PermissionRequest> {
  const { data } = await api.get(`/compliance/permission-requests/${id}`);
  return data;
}

export async function uploadComplianceFile(uri: string, name = 'document.jpg', mimeType = 'image/jpeg') {
  const fd = new FormData();
  fd.append('file', { uri, name, type: mimeType } as unknown as Blob);
  const { data } = await api.post('/uploads/compliance', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { url: string; path: string; filename: string };
}

export async function createComplianceDocument(body: {
  fileUrl: string;
  fileName?: string;
  permissionRequestId?: string;
  legalNoticeId?: string;
}) {
  const { data } = await api.post('/compliance/documents', body);
  return data;
}

export async function fetchComplianceAlerts(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/compliance/alerts', { params: clean(filters) });
  return data;
}
