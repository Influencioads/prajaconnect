import { api } from './api';
import type { Paginated } from './crm';

export const LETTER_TYPE_LABELS: Record<string, string> = {
  department: 'Departmental Request',
  condolence: 'Condolence',
  congratulation: 'Congratulation',
  recommendation: 'Recommendation',
  other: 'Other',
};

export interface LetterRef {
  id: string;
  name: string;
}

export interface LetterListItem {
  id: string;
  refNo: string;
  type: string;
  language: string;
  subject: string;
  body: string;
  bodyTe?: string | null;
  status: 'Draft' | 'Final' | 'Issued';
  addresseeName: string;
  addresseeDesignation?: string | null;
  pdfUrl?: string | null;
  department?: LetterRef | null;
  official?: { id: string; name: string; designation: string } | null;
  citizen?: LetterRef | null;
  grievance?: { id: string; code: string; title: string; status: string } | null;
  createdBy?: { id: string; name: string; designation?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LetterDetail extends LetterListItem {
  official?: { id: string; name: string; designation: string; office?: string | null } | null;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
}

export interface LetterFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}

export interface LetterStats {
  total: number;
  byStatus: Record<string, number>;
}

export interface LetterOptions {
  departments: { id: string; name: string }[];
  officials: { id: string; name: string; designation: string; departmentId?: string | null }[];
}

export interface LetterDraftPayload {
  type: string;
  language?: string;
  points: string[];
  addresseeName: string;
  addresseeDesignation?: string;
  departmentId?: string;
  officialId?: string;
  citizenId?: string;
  grievanceId?: string;
}

export interface LetterDraftResult {
  subject: string;
  body: string;
  bodyTe?: string | null;
  aiGenerated: boolean;
}

function cleanParams(obj: object) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

export async function fetchLetters(filters: LetterFilters): Promise<Paginated<LetterListItem>> {
  const { data } = await api.get('/letters', { params: cleanParams(filters) });
  return data;
}

export async function fetchLetterStats(): Promise<LetterStats> {
  const { data } = await api.get('/letters/stats');
  return data;
}

export async function fetchLetterOptions(): Promise<LetterOptions> {
  const { data } = await api.get('/letters/options');
  return data;
}

export async function fetchLetter(id: string): Promise<LetterDetail> {
  const { data } = await api.get(`/letters/${id}`);
  return data;
}

export async function draftLetter(payload: LetterDraftPayload): Promise<LetterDraftResult> {
  const { data } = await api.post('/letters/draft', payload);
  return data;
}

export async function createLetter(payload: Record<string, unknown>): Promise<LetterDetail> {
  const { data } = await api.post('/letters', payload);
  return data;
}

export async function updateLetter(id: string, payload: Record<string, unknown>): Promise<LetterDetail> {
  const { data } = await api.patch(`/letters/${id}`, payload);
  return data;
}

export async function finalizeLetter(id: string): Promise<LetterDetail> {
  const { data } = await api.post(`/letters/${id}/finalize`);
  return data;
}

export async function sendLetter(
  id: string,
  payload: { channels: string[]; emailTo?: string; whatsappTo?: string },
) {
  const { data } = await api.post(`/letters/${id}/send`, payload);
  return data;
}

export async function downloadLetterPdf(id: string, refNo: string) {
  const res = await api.get(`/letters/${id}/pdf`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${refNo}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
}
