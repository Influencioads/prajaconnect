import { api } from './api';
import type { Paginated } from './crm';

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface DonorListItem {
  id: string;
  name: string;
  mobile?: string | null;
  email?: string | null;
  totalDonated: number;
  _count: { donations: number; followUps: number };
}

export interface FundraisingEventListItem {
  id: string;
  name: string;
  eventDate?: string | null;
  targetAmount: number;
}

export async function searchDonors(search: string): Promise<Paginated<DonorListItem>> {
  const { data } = await api.get('/fundraising/donors', { params: clean({ search, page: 1, limit: 20 }) });
  return data;
}

export async function fetchFundraisingEvents(): Promise<Paginated<FundraisingEventListItem>> {
  const { data } = await api.get('/fundraising/events', { params: { page: 1, limit: 50 } });
  return data;
}

export async function createDonor(body: { name: string; mobile?: string }) {
  const { data } = await api.post('/fundraising/donors', body);
  return data as { id: string; name: string };
}

export async function createDonation(body: {
  donorId: string;
  amount: number;
  paymentMode?: string;
  eventId?: string;
  notes?: string;
}) {
  const { data } = await api.post('/fundraising/donations', body);
  return data;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
