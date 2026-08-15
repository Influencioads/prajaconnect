import { api } from './api';
import type { Paginated } from './crm';

export const LETTER_TYPES = [
  { key: 'department', label: 'Department' },
  { key: 'condolence', label: 'Condolence' },
  { key: 'congratulation', label: 'Congratulation' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'other', label: 'Other' },
];

export interface LetterListItem {
  id: string;
  refNo: string;
  type: string;
  language: string;
  subject: string;
  status: 'Draft' | 'Final' | 'Issued';
  addresseeName: string;
  addresseeDesignation?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
}

export interface LetterDraftResult {
  subject: string;
  body: string;
  bodyTe?: string | null;
  aiGenerated: boolean;
}

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchLetters(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<Paginated<LetterListItem>> {
  const { data } = await api.get('/letters', { params: clean(filters) });
  return data;
}

export async function draftLetter(payload: {
  type: string;
  language?: string;
  points: string[];
  addresseeName: string;
  addresseeDesignation?: string;
}): Promise<LetterDraftResult> {
  const { data } = await api.post('/letters/draft', clean(payload));
  return data;
}

export async function createLetter(payload: Record<string, unknown>): Promise<LetterListItem> {
  const { data } = await api.post('/letters', clean(payload));
  return data;
}
