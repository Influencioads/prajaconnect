import { api } from './api';

export async function fetchVoterDashboard() {
  const { data } = await api.get('/voter-intelligence/dashboard');
  return data;
}

export async function fetchVoterProfiles(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/voter-intelligence/profiles', { params });
  return data;
}

export async function updateVoterProfile(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/voter-intelligence/profiles/${id}`, body);
  return data;
}

export async function fetchVoterBooths(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/voter-intelligence/booths', { params });
  return data;
}

export async function fetchVoterDuplicates(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/voter-intelligence/duplicates', { params });
  return data;
}

export async function reviewVoterDuplicate(id: string, status: string) {
  const { data } = await api.patch(`/voter-intelligence/duplicates/${id}`, { status });
  return data;
}
