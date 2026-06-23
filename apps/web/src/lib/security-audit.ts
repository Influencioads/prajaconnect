import api from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchSecurityAuditDashboard() {
  const { data } = await api.get('/security-audit/dashboard');
  return data;
}

export async function fetchSecurityLoginHistory(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/security-audit/login-history', { params: cleanParams(params) });
  return data;
}

export async function fetchSecuritySessions(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/security-audit/sessions', { params: cleanParams(params) });
  return data;
}

export async function revokeSecuritySession(id: string) {
  const { data } = await api.patch(`/security-audit/sessions/${id}/revoke`);
  return data;
}

export async function fetchSecurityExportLogs(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/security-audit/export-logs', { params: cleanParams(params) });
  return data;
}

export async function fetchSecurityFileAccess(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/security-audit/file-access', { params: cleanParams(params) });
  return data;
}

export async function fetchSecurityAlerts(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/security-audit/suspicious-alerts', { params: cleanParams(params) });
  return data;
}

export async function resolveSecurityAlert(id: string) {
  const { data } = await api.patch(`/security-audit/alerts/${id}/resolve`);
  return data;
}

export async function fetchSecurityRoleActivity(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/security-audit/role-activity', { params: cleanParams(params) });
  return data;
}

export async function fetchSecurityBackupLogs(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/security-audit/backup-logs', { params: cleanParams(params) });
  return data;
}

export async function fetchSecurityPermissionAudit() {
  const { data } = await api.get('/security-audit/permissions/audit');
  return data;
}
