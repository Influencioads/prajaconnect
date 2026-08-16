import api from './api';

export interface MandalScorecardRow {
  id: string;
  mandalId: string;
  date: string;
  grievanceResolutionPct: number;
  slaBreaches: number;
  attendanceRate: number;
  d2dCoverage: number;
  activityCount: number;
  openCrises: number;
  composite: number;
  rank: number;
  previousRank: number | null;
  rankDelta: number;
  compositeDelta: number;
  mandal: { id: string; name: string };
}

export interface MandalScorecardsResponse {
  date: string | null;
  previousDate: string | null;
  data: MandalScorecardRow[];
  movers: { best: MandalScorecardRow[]; worst: MandalScorecardRow[] };
}

export interface LeaderboardEntry {
  rank: number;
  points: number;
  checkIns: number;
  d2dVisits: number;
  activities: number;
  tasksCompleted: number;
  cadre: {
    id: string;
    name: string;
    designation: string;
    photo: string | null;
    performance: number;
    mandal: { id: string; name: string } | null;
    booth: { number: string } | null;
  };
}

export interface LeaderboardResponse {
  period: string;
  from: string | null;
  to: string | null;
  total?: number;
  data: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export async function fetchMandalScorecards(date?: string): Promise<MandalScorecardsResponse> {
  const { data } = await api.get('/scorecards/mandals', { params: date ? { date } : {} });
  return data;
}

export async function fetchMandalScorecardHistory(id: string) {
  const { data } = await api.get(`/scorecards/mandals/${id}/history`);
  return data;
}

export async function fetchLeaderboard(period: string): Promise<LeaderboardResponse> {
  const { data } = await api.get('/scorecards/leaderboard', { params: { period } });
  return data;
}

export async function fetchCadreScoreHistory(id: string) {
  const { data } = await api.get(`/scorecards/cadre/${id}/history`);
  return data;
}

export async function runScorecards(date?: string) {
  const { data } = await api.post('/scorecards/run', date ? { date } : {});
  return data;
}
