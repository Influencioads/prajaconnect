import {
  BoothStrength,
  CampaignTeamType,
  CampaignWorkStatus,
  CampaignWorkType,
  ElectionExpenseStatus,
  ElectionMaterialType,
  ElectionReportType,
  ElectionStatus,
  ElectionVehicleStatus,
  ElectionVehicleType,
  ElectionWorkPriority,
  OutreachChannel,
  PaymentMode,
  PollingDayStatus,
  VoterStance,
} from '@praja/types';
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

export type { BoothStrength, CampaignTeamType, CampaignWorkStatus, CampaignWorkType };
export type { ElectionExpenseStatus, ElectionMaterialType, ElectionReportType, ElectionStatus };
export type { ElectionVehicleStatus, ElectionVehicleType, ElectionWorkPriority };
export type { OutreachChannel, PaymentMode, PollingDayStatus, VoterStance };

export interface ElectionRecord {
  id: string;
  name: string;
  type: string;
  status: ElectionStatus;
  electionDate?: string | null;
  totalBudget: number;
  description?: string | null;
  constituency?: { id: string; name: string } | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  label: string;
}

export interface ElectionExpense {
  id: string;
  title: string;
  amount: number;
  expenseDate: string;
  status: ElectionExpenseStatus;
  paymentMode: PaymentMode;
  vendorName?: string | null;
  paidBy?: string | null;
  receiptUrl?: string | null;
  billUrl?: string | null;
  notes?: string | null;
  category: ExpenseCategory;
  mandal?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  createdBy?: { id: string; name: string } | null;
}

export interface ElectionDashboard {
  election: ElectionRecord;
  kpis: {
    totalBudget: number;
    totalExpenses: number;
    remainingBudget: number;
    boothsCovered: number;
    vehiclesActive: number;
    worksCompleted: number;
    pendingWorks: number;
    volunteerStrength: number;
    voterOutreachCount: number;
    pollingDayReadinessScore: number;
  };
  mandalProgress: { mandalId: string; mandalName: string; boothsCovered: number; avgReadiness: number; worksCount: number }[];
  boothPerformance: { boothId: string; boothNumber: string; boothName?: string | null; mandalName: string; readinessScore: number; strength: string; voterCount: number }[];
  dailyExpenseSummary: { date: string; amount: number }[];
  activityTimeline: { at: string; type: string; title: string; meta?: string }[];
}

// Dashboard
export async function fetchElectionDashboard(electionId?: string): Promise<ElectionDashboard> {
  const { data } = await api.get('/election/dashboard', { params: cleanParams({ electionId }) });
  return data;
}

export async function fetchActiveElection(): Promise<ElectionRecord> {
  const { data } = await api.get('/election/active');
  return data;
}

// Settings
export async function fetchElections(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionRecord>> {
  const { data } = await api.get('/election/settings', { params: cleanParams(filters) });
  return data;
}

export async function createElection(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/settings', payload);
  return data;
}

export async function updateElection(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/settings/${id}`, payload);
  return data;
}

export async function deleteElection(id: string) {
  await api.delete(`/election/settings/${id}`);
}

// Expenses
export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data } = await api.get('/election/expenses/categories');
  return data;
}

export async function fetchElectionExpenses(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionExpense>> {
  const { data } = await api.get('/election/expenses', { params: cleanParams(filters) });
  return data;
}

export async function fetchElectionExpense(id: string): Promise<ElectionExpense> {
  const { data } = await api.get(`/election/expenses/${id}`);
  return data;
}

export async function createElectionExpense(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/expenses', payload);
  return data;
}

export async function updateElectionExpense(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/expenses/${id}`, payload);
  return data;
}

export async function deleteElectionExpense(id: string) {
  await api.delete(`/election/expenses/${id}`);
}

export async function approveElectionExpense(id: string, remarks?: string) {
  const { data } = await api.post(`/election/expenses/${id}/approve`, { remarks });
  return data;
}

export async function rejectElectionExpense(id: string, remarks?: string) {
  const { data } = await api.post(`/election/expenses/${id}/reject`, { remarks });
  return data;
}

export async function fetchExpenseStats(electionId?: string) {
  const { data } = await api.get('/election/expenses/stats', { params: cleanParams({ electionId }) });
  return data;
}

// Works
export async function fetchElectionWorks(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/works', { params: cleanParams(filters) });
  return data;
}

export async function fetchElectionWork(id: string) {
  const { data } = await api.get(`/election/works/${id}`);
  return data;
}

export async function createElectionWork(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/works', payload);
  return data;
}

export async function updateElectionWork(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/works/${id}`, payload);
  return data;
}

export async function deleteElectionWork(id: string) {
  await api.delete(`/election/works/${id}`);
}

export async function assignElectionWork(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/works/${id}/assign`, payload);
  return data;
}

// Vehicles
export async function fetchElectionVehicles(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/vehicles', { params: cleanParams(filters) });
  return data;
}

export async function fetchElectionVehicle(id: string) {
  const { data } = await api.get(`/election/vehicles/${id}`);
  return data;
}

export async function createElectionVehicle(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/vehicles', payload);
  return data;
}

export async function updateElectionVehicle(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/vehicles/${id}`, payload);
  return data;
}

export async function deleteElectionVehicle(id: string) {
  await api.delete(`/election/vehicles/${id}`);
}

export async function fetchVehicleTrips(id: string, page = 1) {
  const { data } = await api.get(`/election/vehicles/${id}/trips`, { params: { page, limit: 20 } });
  return data;
}

export async function addVehicleTrip(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/vehicles/${id}/trips`, payload);
  return data;
}

export async function fetchVehicleFuel(id: string, page = 1) {
  const { data } = await api.get(`/election/vehicles/${id}/fuel`, { params: { page, limit: 20 } });
  return data;
}

export async function addVehicleFuel(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/vehicles/${id}/fuel`, payload);
  return data;
}

// Booths
export async function fetchElectionBooths(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/booths', { params: cleanParams(filters) });
  return data;
}

export async function fetchElectionBooth(id: string) {
  const { data } = await api.get(`/election/booths/${id}`);
  return data;
}

export async function createElectionBooth(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/booths', payload);
  return data;
}

export async function updateElectionBooth(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/booths/${id}`, payload);
  return data;
}

export async function deleteElectionBooth(id: string) {
  await api.delete(`/election/booths/${id}`);
}

export async function addPollingAgent(boothPlanId: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/booths/${boothPlanId}/agents`, payload);
  return data;
}

// Outreach
export async function fetchVoterOutreach(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/voter-outreach', { params: cleanParams(filters) });
  return data;
}

export async function createVoterOutreach(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/voter-outreach', payload);
  return data;
}

export async function updateVoterOutreach(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/voter-outreach/${id}`, payload);
  return data;
}

export async function deleteVoterOutreach(id: string) {
  await api.delete(`/election/voter-outreach/${id}`);
}

export async function fetchOutreachStats(electionId?: string) {
  const { data } = await api.get('/election/voter-outreach/stats', { params: cleanParams({ electionId }) });
  return data;
}

// Teams
export async function fetchElectionTeams(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/teams', { params: cleanParams(filters) });
  return data;
}

export async function fetchElectionTeam(id: string) {
  const { data } = await api.get(`/election/teams/${id}`);
  return data;
}

export async function createElectionTeam(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/teams', payload);
  return data;
}

export async function updateElectionTeam(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/teams/${id}`, payload);
  return data;
}

export async function deleteElectionTeam(id: string) {
  await api.delete(`/election/teams/${id}`);
}

export async function addTeamMember(teamId: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/teams/${teamId}/members`, payload);
  return data;
}

// Materials
export async function fetchElectionMaterials(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/materials', { params: cleanParams(filters) });
  return data;
}

export async function fetchElectionMaterial(id: string) {
  const { data } = await api.get(`/election/materials/${id}`);
  return data;
}

export async function createElectionMaterial(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/materials', payload);
  return data;
}

export async function updateElectionMaterial(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/materials/${id}`, payload);
  return data;
}

export async function deleteElectionMaterial(id: string) {
  await api.delete(`/election/materials/${id}`);
}

export async function distributeMaterial(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/materials/${id}/distribute`, payload);
  return data;
}

export async function fetchMaterialDistributions(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/materials/distributions', { params: cleanParams(filters) });
  return data;
}

// Polling day
export async function fetchPollingDayLive(electionId?: string) {
  const { data } = await api.get('/election/polling-day/live', { params: cleanParams({ electionId }) });
  return data;
}

export async function fetchPollingDayUpdates(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/election/polling-day', { params: cleanParams(filters) });
  return data;
}

export async function createPollingDayUpdate(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/polling-day', payload);
  return data;
}

export async function resolvePollingIssue(id: string) {
  const { data } = await api.patch(`/election/polling-day/${id}/resolve`);
  return data;
}

// Reports
export async function fetchElectionReportTypes() {
  const { data } = await api.get('/election/reports/types');
  return data;
}

export async function fetchElectionReports(electionId?: string) {
  const { data } = await api.get('/election/reports', { params: cleanParams({ electionId }) });
  return data;
}

export async function downloadElectionReport(type: string, format: 'csv' | 'xlsx' | 'pdf' = 'csv', electionId?: string) {
  const res = await api.get(`/election/reports/export/${type}`, {
    params: cleanParams({ format, electionId }),
    responseType: 'blob',
  });
  const disposition = (res.headers['content-disposition'] as string | undefined) ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `election-${type}.${format === 'pdf' ? 'html' : 'csv'}`;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function uploadElectionFile(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/uploads/election', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data as { url: string; path: string };
}
