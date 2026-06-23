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

export interface ComplianceDashboard {
  pendingPermissions: number;
  approvedPermissions: number;
  openAlerts: number;
  openNotices: number;
  documentCount: number;
  checklistStats: { id: string; name: string; completed: number; total: number; completionPct: number }[];
  recentRequests: PermissionRequest[];
}

export interface ComplianceDocument {
  id: string;
  fileUrl: string;
  fileName?: string | null;
  permissionRequestId?: string | null;
  legalNoticeId?: string | null;
  createdAt: string;
  permissionRequest?: { id: string; title: string; type?: string } | null;
  legalNotice?: { id: string; title: string; reference?: string | null } | null;
}

export interface PermissionRequest {
  id: string;
  type: string;
  title: string;
  status: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  documents?: ComplianceDocument[];
}

export interface ComplianceChecklistItem {
  id: string;
  checklistId: string;
  label: string;
  completed: boolean;
}

export interface ComplianceChecklist {
  id: string;
  name: string;
  createdAt: string;
  items: ComplianceChecklistItem[];
}

export interface LegalNotice {
  id: string;
  title: string;
  reference?: string | null;
  status: string;
  createdAt: string;
  documents?: ComplianceDocument[];
}

export interface ComplianceAlert {
  id: string;
  message: string;
  severity: string;
  resolved: boolean;
  createdAt: string;
}

export interface ExpenseComplianceReport {
  election: { id: string; name: string; type: string } | null;
  summary: {
    totalExpenses: number;
    totalAmount: number;
    pendingApproval: number;
    missingReceipts: number;
    approvedAmount: number;
  };
  byCategory: { category: string; count: number; amount: number; missingDocs: number }[];
  byStatus: { status: string; count: number; amount: number }[];
  flaggedExpenses: {
    id: string;
    title: string;
    amount: number;
    expenseDate: string;
    status: string;
    category: string;
    mandal: string | null;
    issue: string;
  }[];
}

export const PERMISSION_TYPES = ['Rally', 'Vehicle', 'Event', 'Loudspeaker', 'Police'] as const;
export const PERMISSION_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;

export async function fetchComplianceDashboard(): Promise<ComplianceDashboard> {
  const { data } = await api.get('/compliance/dashboard');
  return data;
}

export async function fetchPermissionRequests(
  filters: Record<string, unknown> = {},
): Promise<Paginated<PermissionRequest>> {
  const { data } = await api.get('/compliance/permission-requests', { params: cleanParams(filters) });
  return data;
}

export async function fetchPermissionRequest(id: string): Promise<PermissionRequest> {
  const { data } = await api.get(`/compliance/permission-requests/${id}`);
  return data;
}

export async function createPermissionRequest(body: {
  type: string;
  title: string;
  details?: Record<string, unknown>;
}) {
  const { data } = await api.post('/compliance/permission-requests', body);
  return data;
}

export async function updatePermissionRequest(
  id: string,
  body: { title?: string; status?: string; details?: Record<string, unknown> },
) {
  const { data } = await api.patch(`/compliance/permission-requests/${id}`, body);
  return data;
}

export async function fetchChecklists(
  filters: Record<string, unknown> = {},
): Promise<Paginated<ComplianceChecklist>> {
  const { data } = await api.get('/compliance/checklists', { params: cleanParams(filters) });
  return data;
}

export async function createChecklist(body: { name: string; items?: string[] }) {
  const { data } = await api.post('/compliance/checklists', body);
  return data;
}

export async function toggleChecklistItem(itemId: string, completed?: boolean) {
  const { data } = await api.patch(`/compliance/checklists/items/${itemId}/toggle`, { completed });
  return data;
}

export async function fetchLegalNotices(
  filters: Record<string, unknown> = {},
): Promise<Paginated<LegalNotice>> {
  const { data } = await api.get('/compliance/legal-notices', { params: cleanParams(filters) });
  return data;
}

export async function createLegalNotice(body: { title: string; reference?: string; status?: string }) {
  const { data } = await api.post('/compliance/legal-notices', body);
  return data;
}

export async function updateLegalNotice(
  id: string,
  body: { title?: string; reference?: string; status?: string },
) {
  const { data } = await api.patch(`/compliance/legal-notices/${id}`, body);
  return data;
}

export async function deleteLegalNotice(id: string) {
  const { data } = await api.delete(`/compliance/legal-notices/${id}`);
  return data;
}

export async function fetchComplianceDocuments(
  filters: Record<string, unknown> = {},
): Promise<Paginated<ComplianceDocument>> {
  const { data } = await api.get('/compliance/documents', { params: cleanParams(filters) });
  return data;
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

export async function deleteComplianceDocument(id: string) {
  const { data } = await api.delete(`/compliance/documents/${id}`);
  return data;
}

export async function fetchComplianceAlerts(
  filters: Record<string, unknown> = {},
): Promise<Paginated<ComplianceAlert>> {
  const { data } = await api.get('/compliance/alerts', { params: cleanParams(filters) });
  return data;
}

export async function resolveComplianceAlert(id: string) {
  const { data } = await api.patch(`/compliance/alerts/${id}/resolve`);
  return data;
}

export async function fetchExpenseComplianceReport(): Promise<ExpenseComplianceReport> {
  const { data } = await api.get('/compliance/reports/expenses');
  return data;
}

export async function uploadComplianceFile(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/uploads/compliance', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { url: string; path: string; filename: string; mimeType: string; size: number };
}

export async function downloadExpenseComplianceReport() {
  const response = await api.get('/compliance/reports/expenses/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expense-compliance.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
