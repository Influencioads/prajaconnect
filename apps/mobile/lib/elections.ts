import { api } from './api';
import type { Paginated } from './crm';

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface ElectionRecord {
  id: string;
  name: string;
  type: string;
  status: string;
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
  status: string;
  paymentMode: string;
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

export interface ElectionWork {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  deadline?: string | null;
  description?: string | null;
  mandal?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  proofUrl?: string | null;
  photoUrls?: string[] | null;
}

export interface ElectionVehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  driverName?: string | null;
  driverMobile?: string | null;
}

export interface ElectionBooth {
  id: string;
  boothId: string;
  strength?: string | null;
  readinessScore?: number | null;
  voterCount?: number | null;
  issues?: string | null;
  campaignStatus?: string | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  mandal?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
}

export interface ElectionMaterial {
  id: string;
  type: string;
  name: string;
  stockTotal: number;
  stockRemaining?: number | null;
  vendorName?: string | null;
}

export interface VehicleTrip {
  id: string;
  tripDate: string;
  startKm: number;
  endKm?: number | null;
  route?: string | null;
  notes?: string | null;
}

export async function fetchElectionDashboard(electionId?: string): Promise<ElectionDashboard> {
  const { data } = await api.get('/election/dashboard', { params: clean({ electionId }) });
  return data;
}

export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data } = await api.get('/election/expenses/categories');
  return data;
}

export async function fetchElectionExpenses(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionExpense>> {
  const { data } = await api.get('/election/expenses', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function createElectionExpense(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/expenses', payload);
  return data;
}

export async function fetchElectionWorks(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionWork>> {
  const { data } = await api.get('/election/works', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function fetchMyWorks(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionWork>> {
  const { data } = await api.get('/election/works/my', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function fetchElectionWork(id: string): Promise<ElectionWork> {
  const { data } = await api.get(`/election/works/${id}`);
  return data;
}

export async function updateElectionWork(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/works/${id}`, payload);
  return data;
}

export async function fetchElectionVehicles(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionVehicle>> {
  const { data } = await api.get('/election/vehicles', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function fetchVehicleTrips(vehicleId: string, page = 1) {
  const { data } = await api.get(`/election/vehicles/${vehicleId}/trips`, { params: { page, limit: 20 } });
  return data as Paginated<VehicleTrip>;
}

export async function addVehicleTrip(vehicleId: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/vehicles/${vehicleId}/trips`, payload);
  return data;
}

export async function addVehicleFuel(vehicleId: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/vehicles/${vehicleId}/fuel`, payload);
  return data;
}

export async function fetchElectionBooths(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionBooth>> {
  const { data } = await api.get('/election/booths', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function updateElectionBooth(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/election/booths/${id}`, payload);
  return data;
}

export async function createPollingDayUpdate(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/polling-day', payload);
  return data;
}

export async function createVoterOutreach(payload: Record<string, unknown>) {
  const { data } = await api.post('/election/voter-outreach', payload);
  return data;
}

export async function fetchElectionMaterials(filters: Record<string, unknown> = {}): Promise<Paginated<ElectionMaterial>> {
  const { data } = await api.get('/election/materials', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function distributeMaterial(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/election/materials/${id}/distribute`, payload);
  return data;
}

export async function uploadElectionFile(uri: string, name = 'receipt.jpg', mimeType = 'image/jpeg') {
  const fd = new FormData();
  fd.append('file', { uri, name, type: mimeType } as unknown as Blob);
  const { data } = await api.post('/uploads/election', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { url: string; path: string };
}
