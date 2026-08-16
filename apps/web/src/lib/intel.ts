import api from './api';

export interface IntelTheme {
  theme: string;
  count: number;
  sentiment: string;
  sampleQuotes?: string[];
}

export interface IntelEmergingIssue {
  issue: string;
  areas: string[];
  growth: number;
  count: number;
  priorCount: number;
}

export interface IntelSentimentShift {
  current: { Supporter: number; Neutral: number; Opponent: number; total: number; netPct: number };
  prior: { Supporter: number; Neutral: number; Opponent: number; total: number; netPct: number };
  deltaNetPct: number;
}

export interface D2DInsight {
  id: string;
  periodStart: string;
  periodEnd: string;
  scope: string;
  scopeId: string | null;
  themes: IntelTheme[];
  emergingIssues: IntelEmergingIssue[];
  sentimentShift: IntelSentimentShift;
  generatedBy: string;
  createdAt: string;
}

export interface BoothFactor {
  key: string;
  label: string;
  value: number;
  weight: number;
}

export interface BoothRisk {
  boothId: string;
  number: string;
  name: string | null;
  village: string | null;
  mandal: string | null;
  voterCount: number;
  riskScore: number;
  factors: BoothFactor[];
  stats: Record<string, number>;
}

export interface VisitorPrepItem {
  kind: 'appointment' | 'visitor';
  id: string;
  name: string;
  mobile: string | null;
  purpose: string;
  at: string | null;
  citizenId: string | null;
  brief: string | null;
  briefTe: string | null;
}

export async function fetchD2dInsight(scope?: string) {
  const { data } = await api.get<D2DInsight | null>('/intel/d2d/latest', {
    params: scope ? { scope } : {},
  });
  return data;
}

export async function runD2dMining(days?: number) {
  const { data } = await api.post<D2DInsight>('/intel/d2d/run', days ? { days } : {});
  return data;
}

export async function fetchBoothPriority(limit = 20) {
  const { data } = await api.get<{ weights: Record<string, number>; data: BoothRisk[] }>(
    '/intel/booths/priority',
    { params: { limit } },
  );
  return data;
}

export async function explainBooth(boothId: string) {
  const { data } = await api.post<{ booth: BoothRisk; explanation: string; generatedBy: string }>(
    `/intel/booths/${boothId}/explain`,
  );
  return data;
}

export async function fetchVisitorPrep() {
  const { data } = await api.get<{ date: string; count: number; items: VisitorPrepItem[] }>(
    '/intel/visitor-prep/today',
  );
  return data;
}

export async function fetchCitizenBrief(citizenId: string, refresh = false) {
  const { data } = await api.get<{ brief: string; briefTe: string | null; generatedAt: string }>(
    `/intel/citizen/${citizenId}/brief`,
    { params: refresh ? { refresh: 'true' } : {} },
  );
  return data;
}
