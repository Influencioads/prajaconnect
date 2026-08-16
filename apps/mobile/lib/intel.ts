import { api } from './api';

export type BoothFactor = { key: string; label: string; value: number; weight: number };

export type BoothRisk = {
  boothId: string;
  number: string;
  name: string | null;
  village: string | null;
  mandal: string | null;
  riskScore: number;
  factors: BoothFactor[];
  stats: Record<string, number>;
};

export type EmergingIssue = {
  issue: string;
  areas: string[];
  growth: number;
  count: number;
  priorCount: number;
};

export async function fetchBoothPriority(limit = 15) {
  const { data } = await api.get<{ data: BoothRisk[] }>('/intel/booths/priority', { params: { limit } });
  return data;
}

export async function fetchD2dInsight() {
  const { data } = await api.get<{
    emergingIssues: EmergingIssue[];
    sentimentShift: { current: { netPct: number; total: number }; deltaNetPct: number };
    generatedBy: string;
    createdAt: string;
  } | null>('/intel/d2d/latest');
  return data;
}

export async function fetchCitizenBrief(citizenId: string, refresh = false) {
  const { data } = await api.get<{ brief: string; briefTe: string | null; generatedAt: string }>(
    `/intel/citizen/${citizenId}/brief`,
    { params: refresh ? { refresh: 'true' } : {} },
  );
  return data;
}
