import { api } from './api';
import type { Paginated } from './fundraising';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const FUND_STAGES = ['Recommended', 'Sanctioned', 'Released', 'Completed', 'UCSubmitted'] as const;
export type FundStage = (typeof FUND_STAGES)[number];

export interface FundSourceSummary {
  id: string;
  name: string;
  type: string;
  financialYear: string;
  active: boolean;
  works: number;
  allocated: number;
  recommended: number;
  sanctioned: number;
  released: number;
  ucSubmitted: number;
  unspent: number;
  utilizationPct: number;
  daysToFyEnd: number | null;
  byStage: Record<string, number>;
}

export interface FundsDashboard {
  sources: FundSourceSummary[];
  totals: {
    allocated: number;
    recommended: number;
    sanctioned: number;
    released: number;
    ucSubmitted: number;
    unspent: number;
    works: number;
  };
}

export interface FundSource {
  id: string;
  name: string;
  type: string;
  financialYear: string;
  allocated: string | number;
  active: boolean;
  _count?: { works: number };
}

export interface FundWork {
  id: string;
  title: string;
  stage: FundStage;
  estimatedCost: string | number;
  releasedAmount: string | number;
  sanctionNo?: string | null;
  recommendedAt?: string | null;
  sanctionedAt?: string | null;
  ucSubmittedAt?: string | null;
  notes?: string | null;
  fundSource?: { id: string; name: string; financialYear: string };
  project?: { id: string; name: string; progressPct: number } | null;
  mandal?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
}

export interface WorkProgressUpdate {
  id: string;
  milestone: string;
  percentComplete: number;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  createdAt: string;
  reportedBy?: { id: string; name: string };
}

export async function fetchFundsDashboard(): Promise<FundsDashboard> {
  const { data } = await api.get('/funds/dashboard');
  return data;
}

export async function fetchFundSources(): Promise<FundSource[]> {
  const { data } = await api.get('/funds/sources');
  return data;
}

export async function createFundSource(body: {
  name: string;
  type?: string;
  financialYear: string;
  allocated?: number;
}) {
  const { data } = await api.post('/funds/sources', body);
  return data;
}

export async function fetchFundWorks(filters: Record<string, unknown> = {}): Promise<Paginated<FundWork>> {
  const { data } = await api.get('/funds/works', { params: cleanParams(filters) });
  return data;
}

export async function createFundWork(body: {
  fundSourceId: string;
  title: string;
  estimatedCost?: number;
  projectId?: string;
  mandalId?: string;
  notes?: string;
}) {
  const { data } = await api.post('/funds/works', body);
  return data;
}

export async function advanceFundWorkStage(
  id: string,
  body: { stage: FundStage; sanctionNo?: string; amount?: number; reference?: string },
) {
  const { data } = await api.post(`/funds/works/${id}/stage`, body);
  return data;
}

export async function runFundsAlert() {
  const { data } = await api.post('/funds/alerts/run');
  return data;
}

export async function fetchProjectProgress(projectId: string): Promise<WorkProgressUpdate[]> {
  const { data } = await api.get(`/projects/${projectId}/progress`);
  return data;
}

export function rupees(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;
}
