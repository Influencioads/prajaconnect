import { api } from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchCallCenterDashboard() {
  const { data } = await api.get('/call-center/dashboard');
  return data;
}

export async function fetchCallQueues() {
  const { data } = await api.get('/call-center/queues');
  return data;
}

export async function createCallQueue(body: { name: string; priority?: number }) {
  const { data } = await api.post('/call-center/queues', body);
  return data;
}

export async function updateCallQueue(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/call-center/queues/${id}`, body);
  return data;
}

export async function deleteCallQueue(id: string) {
  const { data } = await api.delete(`/call-center/queues/${id}`);
  return data;
}

export async function fetchCalls(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/call-center/calls', { params: cleanParams(params) });
  return data;
}

export async function fetchCall(id: string) {
  const { data } = await api.get(`/call-center/calls/${id}`);
  return data;
}

export async function createCall(body: Record<string, unknown>) {
  const { data } = await api.post('/call-center/calls', body);
  return data;
}

export async function updateCall(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/call-center/calls/${id}`, body);
  return data;
}

export async function createTempGrievanceFromCall(id: string, body?: { notes?: string }) {
  const { data } = await api.post(`/call-center/calls/${id}/create-temp-grievance`, body ?? {});
  return data;
}

export async function fetchCallFollowUps(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/call-center/follow-ups', { params: cleanParams(params) });
  return data;
}

export async function createCallFollowUp(body: { callLogId: string; dueAt: string }) {
  const { data } = await api.post('/call-center/follow-ups', body);
  return data;
}

export async function updateCallFollowUp(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/call-center/follow-ups/${id}`, body);
  return data;
}

export async function fetchCallAgents() {
  const { data } = await api.get('/call-center/agents');
  return data;
}

export async function fetchCallScripts() {
  const { data } = await api.get('/call-center/scripts');
  return data;
}

export async function createCallScript(body: { title: string; content: string }) {
  const { data } = await api.post('/call-center/scripts', body);
  return data;
}

export async function fetchAgentPerformance() {
  const { data } = await api.get('/call-center/reports/agent-performance');
  return data;
}

export async function fetchDispositionReport() {
  const { data } = await api.get('/call-center/reports/disposition');
  return data;
}

export async function downloadCallCenterReport(type: string) {
  const response = await api.get(`/call-center/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `call-center-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
