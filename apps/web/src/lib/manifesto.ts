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

export interface ManifestoDashboard {
  totalPromises: number;
  byStatus: Record<string, number>;
  avgCompletionPct: number;
  budgetTotal: number;
  budgetSpent: number;
  categories: PromiseCategory[];
  recentPromises: ElectionPromise[];
}

export interface PromiseCategory {
  id: string;
  name: string;
  _count?: { promises: number };
}

export interface ElectionPromise {
  id: string;
  title: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  department?: string | null;
  completionPct: number;
  budgetTotal: number;
  budgetSpent: number;
  workStatus: string;
  createdAt: string;
  updatedAt: string;
  publicUpdates?: PromisePublicUpdate[];
  statusLogs?: PromiseWorkStatusLog[];
  _count?: { publicUpdates: number; statusLogs: number };
}

export interface PromisePublicUpdate {
  id: string;
  promiseId: string;
  note: string;
  isPublic: boolean;
  createdAt: string;
  promise?: { id: string; title: string };
}

export interface PromiseWorkStatusLog {
  id: string;
  promiseId: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface DepartmentMatrixRow {
  department: string;
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  delayed: number;
  avgCompletion: number;
  budgetTotal: number;
  budgetSpent: number;
}

export const PROMISE_WORK_STATUSES = ['NotStarted', 'InProgress', 'Completed', 'Delayed'] as const;

export async function fetchManifestoDashboard(): Promise<ManifestoDashboard> {
  const { data } = await api.get('/manifesto/dashboard');
  return data;
}

export async function fetchPromiseCategories(filters: Record<string, unknown> = {}): Promise<Paginated<PromiseCategory>> {
  const { data } = await api.get('/manifesto/categories', { params: cleanParams(filters) });
  return data;
}

export async function createPromiseCategory(body: { name: string }) {
  const { data } = await api.post('/manifesto/categories', body);
  return data;
}

export async function deletePromiseCategory(id: string) {
  const { data } = await api.delete(`/manifesto/categories/${id}`);
  return data;
}

export async function fetchPromises(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionPromise>> {
  const { data } = await api.get('/manifesto/promises', { params: cleanParams(filters) });
  return data;
}

export async function fetchPromise(id: string): Promise<ElectionPromise> {
  const { data } = await api.get(`/manifesto/promises/${id}`);
  return data;
}

export async function createPromise(body: {
  title: string;
  categoryId?: string;
  department?: string;
  completionPct?: number;
  budgetTotal?: number;
  budgetSpent?: number;
  workStatus?: string;
}) {
  const { data } = await api.post('/manifesto/promises', body);
  return data;
}

export async function updatePromise(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/manifesto/promises/${id}`, body);
  return data;
}

export async function createPublicUpdate(body: { promiseId: string; note: string; isPublic?: boolean }) {
  const { data } = await api.post('/manifesto/public-updates', body);
  return data;
}

export async function fetchDepartmentMatrix(): Promise<DepartmentMatrixRow[]> {
  const { data } = await api.get('/manifesto/departments/matrix');
  return data;
}

export async function downloadManifestoReport(type: string) {
  const response = await api.get(`/manifesto/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `manifesto-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
