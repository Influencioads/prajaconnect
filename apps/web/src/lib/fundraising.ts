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

export interface FundraisingDashboard {
  totalDonors: number;
  totalDonations: number;
  totalAmount: number;
  pendingFollowUps: number;
  recentDonations: DonationListItem[];
  topDonors: { donor?: { id: string; name: string }; totalAmount: number }[];
  events: FundraisingEventListItem[];
  upcomingReminders: DonorFollowUp[];
}

export interface DonorListItem {
  id: string;
  name: string;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
  totalDonated: number;
  _count: { donations: number; followUps: number };
}

export interface DonorDetail extends Omit<DonorListItem, 'totalDonated' | '_count'> {
  totalDonated: number;
  donations: DonationListItem[];
  followUps: DonorFollowUp[];
  communications: DonorCommunication[];
  _count: { donations: number; followUps: number; communications: number };
}

export interface DonationListItem {
  id: string;
  amount: number;
  paymentMode: string;
  notes?: string | null;
  createdAt: string;
  donor?: { id: string; name: string; mobile?: string | null };
  event?: { id: string; name: string } | null;
  receipt?: { receiptNo: string; issuedAt?: string } | null;
}

export interface DonationDetail extends DonationListItem {
  donor: {
    id: string;
    name: string;
    mobile?: string | null;
    email?: string | null;
    address?: string | null;
  };
  event?: { id: string; name: string; eventDate?: string | null } | null;
  receipt?: { id: string; receiptNo: string; issuedAt: string } | null;
}

export interface FundraisingEventListItem {
  id: string;
  name: string;
  eventDate?: string | null;
  targetAmount: number;
  donationCount: number;
  raisedAmount: number;
  createdAt?: string;
}

export interface DonorFollowUp {
  id: string;
  donorId: string;
  dueDate: string;
  notes?: string | null;
  completed: boolean;
  createdAt: string;
  donor?: { id: string; name: string; mobile?: string | null };
}

export interface DonorCommunication {
  id: string;
  donorId: string;
  channel: string;
  message: string;
  createdAt: string;
  donor?: { id: string; name: string };
}

export interface FollowUpReminders {
  overdue: DonorFollowUp[];
  upcoming: DonorFollowUp[];
}

export async function fetchFundraisingDashboard(): Promise<FundraisingDashboard> {
  const { data } = await api.get('/fundraising/dashboard');
  return data;
}

export async function fetchDonors(filters: Record<string, unknown> = {}): Promise<Paginated<DonorListItem>> {
  const { data } = await api.get('/fundraising/donors', { params: cleanParams(filters) });
  return data;
}

export async function fetchDonor(id: string): Promise<DonorDetail> {
  const { data } = await api.get(`/fundraising/donors/${id}`);
  return data;
}

export async function createDonor(body: { name: string; mobile?: string; email?: string; address?: string }) {
  const { data } = await api.post('/fundraising/donors', body);
  return data;
}

export async function updateDonor(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/fundraising/donors/${id}`, body);
  return data;
}

export async function fetchDonations(filters: Record<string, unknown> = {}): Promise<Paginated<DonationListItem>> {
  const { data } = await api.get('/fundraising/donations', { params: cleanParams(filters) });
  return data;
}

export async function fetchDonation(id: string): Promise<DonationDetail> {
  const { data } = await api.get(`/fundraising/donations/${id}`);
  return data;
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

export async function updateDonation(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/fundraising/donations/${id}`, body);
  return data;
}

export async function issueDonationReceipt(id: string) {
  const { data } = await api.post(`/fundraising/donations/${id}/receipt`);
  return data;
}

export async function fetchFundraisingEvents(filters: Record<string, unknown> = {}): Promise<Paginated<FundraisingEventListItem>> {
  const { data } = await api.get('/fundraising/events', { params: cleanParams(filters) });
  return data;
}

export async function createFundraisingEvent(body: { name: string; eventDate?: string; targetAmount?: number }) {
  const { data } = await api.post('/fundraising/events', body);
  return data;
}

export async function updateFundraisingEvent(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/fundraising/events/${id}`, body);
  return data;
}

export async function deleteFundraisingEvent(id: string) {
  const { data } = await api.delete(`/fundraising/events/${id}`);
  return data;
}

export async function fetchFollowUps(filters: Record<string, unknown> = {}): Promise<Paginated<DonorFollowUp>> {
  const { data } = await api.get('/fundraising/follow-ups', { params: cleanParams(filters) });
  return data;
}

export async function fetchFollowUpReminders(): Promise<FollowUpReminders> {
  const { data } = await api.get('/fundraising/follow-ups/reminders');
  return data;
}

export async function createFollowUp(body: { donorId: string; dueDate: string; notes?: string }) {
  const { data } = await api.post('/fundraising/follow-ups', body);
  return data;
}

export async function updateFollowUp(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/fundraising/follow-ups/${id}`, body);
  return data;
}

export async function deleteFollowUp(id: string) {
  const { data } = await api.delete(`/fundraising/follow-ups/${id}`);
  return data;
}

export async function createCommunication(body: { donorId: string; channel: string; message: string }) {
  const { data } = await api.post('/fundraising/communications', body);
  return data;
}

export async function downloadFundraisingReport(type: string) {
  const response = await api.get(`/fundraising/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `fundraising-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
