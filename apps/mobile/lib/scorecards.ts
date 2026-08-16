import { api } from './api';

export async function fetchMandalScorecards(date?: string) {
  const { data } = await api.get('/scorecards/mandals', { params: date ? { date } : {} });
  return data;
}

export async function fetchLeaderboard(period: string) {
  const { data } = await api.get('/scorecards/leaderboard', { params: { period } });
  return data;
}

export async function fetchCadreScoreHistory(id: string) {
  const { data } = await api.get(`/scorecards/cadre/${id}/history`);
  return data;
}
