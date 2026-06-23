import api from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchPublicPortalDashboard() {
  const { data } = await api.get('/public-portal/dashboard');
  return data;
}

export async function fetchPublicPortalGrievances(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/public-portal/grievances', { params: cleanParams(params) });
  return data;
}

export async function fetchPublicPortalFeedback(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/public-portal/feedback', { params: cleanParams(params) });
  return data;
}

export async function fetchPublicPortalVolunteers(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/public-portal/volunteers', { params: cleanParams(params) });
  return data;
}

export async function approvePublicVolunteer(id: string) {
  const { data } = await api.patch(`/public-portal/volunteers/${id}/approve`);
  return data;
}

export async function rejectPublicVolunteer(id: string) {
  const { data } = await api.patch(`/public-portal/volunteers/${id}/reject`);
  return data;
}

export async function requestPublicOtp(mobile: string) {
  const { data } = await api.post('/public-portal/auth/otp-request', { mobile });
  return data;
}

export async function verifyPublicOtp(mobile: string, code: string) {
  const { data } = await api.post('/public-portal/auth/otp-verify', { mobile, code });
  return data;
}

export async function fetchPublicEvents() {
  const { data } = await api.get('/public-portal/events');
  return data;
}

export async function registerPublicEvent(body: { eventId: string; name: string; mobile: string }) {
  const { data } = await api.post('/public-portal/event-registrations', body);
  return data;
}

export async function checkPublicEligibility(params: Record<string, unknown>) {
  const { data } = await api.get('/public-portal/schemes/eligibility-check', { params: cleanParams(params) });
  return data;
}
