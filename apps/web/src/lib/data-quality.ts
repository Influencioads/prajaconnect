import { api } from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchDataQualityDashboard() {
  const { data } = await api.get('/data-quality/dashboard');
  return data;
}

export async function fetchDataQualityIssues(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/data-quality/issues', { params: cleanParams(params) });
  return data;
}

export async function resolveDataQualityIssue(id: string) {
  const { data } = await api.patch(`/data-quality/issues/${id}/resolve`);
  return data;
}

export async function fetchMergeSuggestions(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/data-quality/merge-suggestions', { params: cleanParams(params) });
  return data;
}

export async function reviewMergeSuggestion(id: string, status: string) {
  const { data } = await api.patch(`/data-quality/merge-suggestions/${id}`, { status });
  return data;
}

export async function executeMergeSuggestion(id: string) {
  const { data } = await api.post(`/data-quality/merge-suggestions/${id}/execute`);
  return data;
}

export async function detectCitizenDuplicates() {
  const { data } = await api.post('/data-quality/detect/citizens');
  return data;
}

export async function detectGrievanceDuplicates() {
  const { data } = await api.post('/data-quality/detect/grievances');
  return data;
}

export async function checkCitizenDuplicate(mobile?: string, name?: string) {
  const { data } = await api.get('/data-quality/check-citizen-duplicate', {
    params: cleanParams({ mobile, name }),
  });
  return data;
}

export async function normalizeAddress(body: { citizenId: string; address: string }) {
  const { data } = await api.post('/data-quality/normalize/address', body);
  return data;
}

export async function validateMobile(body: { mobile: string; citizenId?: string }) {
  const { data } = await api.post('/data-quality/validate/mobile', body);
  return data;
}

export async function downloadDataQualityReport(type: string) {
  const response = await api.get(`/data-quality/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `data-quality-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
