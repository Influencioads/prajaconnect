import { api } from './api';

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchCallCenterDashboard() {
  const { data } = await api.get('/call-center/dashboard');
  return data;
}

export async function fetchCalls(filters: Record<string, unknown> = {}) {
  const { data } = await api.get('/call-center/calls', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function fetchCallQueues() {
  const { data } = await api.get('/call-center/queues');
  return data;
}

export async function fetchCallAgents() {
  const { data } = await api.get('/call-center/agents');
  return data;
}

export async function createCall(body: Record<string, unknown>) {
  const { data } = await api.post('/call-center/calls', body);
  return data;
}

export async function createTempGrievanceFromCall(id: string) {
  const { data } = await api.post(`/call-center/calls/${id}/create-temp-grievance`, {});
  return data;
}
