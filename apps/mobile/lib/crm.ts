import { api } from './api';

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  data: T[];
  meta: ApiMeta;
}

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

// ---------- Dashboard ----------
export interface DashboardData {
  kpis: {
    citizens: number;
    cadre: number;
    activeCadre: number;
    grievancesTotal: number;
    grievancesOpen: number;
    grievancesResolved: number;
    resolutionRate: number;
    beneficiaries: number;
    whatsappConversations: number;
    events: number;
    projects: number;
    schemes: number;
  };
  recentGrievances: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    citizen?: string;
    mandal?: string;
    createdAt: string;
  }[];
}
export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get('/dashboard');
  return data;
}

// ---------- Grievances ----------
export interface GrievanceListItem {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  category?: string | null;
  createdAt: string;
  mandal?: { name: string } | null;
  citizen?: { name: string } | null;
}
export interface GrievanceUpdateItem {
  id: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt: string;
}
export interface GrievanceDetail extends GrievanceListItem {
  description: string;
  channel: string;
  address?: string | null;
  reportedByName?: string | null;
  reportedByMobile?: string | null;
  department?: { id: string; name: string } | null;
  assignedOfficial?: { id: string; name: string } | null;
  assignedCadre?: { id: string; name: string } | null;
  slaDueAt?: string | null;
  resolvedAt?: string | null;
  satisfactionRating?: number | null;
  feedback?: string | null;
  updates: GrievanceUpdateItem[];
}
export interface GrievanceOptions {
  departments: { id: string; name: string }[];
  officials: { id: string; name: string; designation: string }[];
  cadres: { id: string; name: string; designation: string }[];
}

export async function fetchGrievances(filters: {
  page?: number;
  search?: string;
  status?: string;
}): Promise<Paginated<GrievanceListItem>> {
  const { data } = await api.get('/grievances', { params: clean({ ...filters, limit: 20 }) });
  return data;
}
export async function fetchGrievance(id: string): Promise<GrievanceDetail> {
  const { data } = await api.get(`/grievances/${id}`);
  return data;
}
export async function fetchGrievanceOptions(): Promise<GrievanceOptions> {
  const { data } = await api.get('/grievances/options');
  return data;
}
export async function createGrievance(payload: Record<string, unknown>) {
  return (await api.post('/grievances', payload)).data;
}
export const GRIEVANCE_STATUSES = ['Open', 'Assigned', 'InProgress', 'Escalated', 'Resolved', 'Closed'] as const;
export async function changeGrievanceStatus(id: string, status: string, note?: string) {
  return (await api.post(`/grievances/${id}/status`, clean({ status, note }))).data;
}
export async function addGrievanceNote(id: string, note: string) {
  return (await api.post(`/grievances/${id}/notes`, { note })).data;
}

// ---------- Temporary Grievances ----------
export interface TempGrievanceListItem {
  id: string;
  tempTicketId: string;
  source: string;
  citizenName?: string | null;
  mobileNumber?: string | null;
  issueSummary?: string | null;
  issueCategory?: string | null;
  priority: string;
  validationStatus: string;
  duplicateRiskScore: number;
  duplicateRisk: string;
  mandal?: { name: string } | null;
  village?: { name: string } | null;
  assignedValidator?: { name: string } | null;
  createdAt: string;
}
export interface TempGrievanceDetail extends TempGrievanceListItem {
  issueDescription?: string | null;
  originalMessage?: string | null;
  validationChecklist?: Record<string, boolean> | null;
  notes: { id: string; note: string; createdAt: string }[];
  validationLogs: { id: string; validationAction: string; remarks?: string | null; createdAt: string }[];
  duplicates: { id: string; matchScore: number; matchReason?: string | null; matchedGrievanceId?: string | null }[];
  convertedGrievance?: { id: string; code: string } | null;
}
export interface TempGrievanceAnalytics {
  total: number;
  pendingValidation: number;
  validatedToday: number;
  converted: number;
  rejectedSpam: number;
  duplicateSuspected: number;
}

export async function fetchTempGrievances(filters: Record<string, unknown>): Promise<Paginated<TempGrievanceListItem>> {
  const { data } = await api.get('/temp-grievances', { params: clean({ ...filters, limit: 20 }) });
  return data;
}
export async function fetchTempGrievanceAnalytics(): Promise<TempGrievanceAnalytics> {
  const { data } = await api.get('/temp-grievances/analytics');
  return data;
}
export async function fetchTempGrievance(id: string): Promise<TempGrievanceDetail> {
  const { data } = await api.get(`/temp-grievances/${id}`);
  return data;
}
export async function createTempGrievance(payload: Record<string, unknown>) {
  return (await api.post('/temp-grievances', payload)).data;
}
export async function validateTempGrievance(id: string, checklist: Record<string, boolean>) {
  return (await api.post(`/temp-grievances/${id}/validate`, { checklist })).data;
}
export async function convertTempGrievance(id: string, payload: Record<string, unknown>) {
  return (await api.post(`/temp-grievances/${id}/convert`, payload)).data;
}
export async function requestTempGrievanceMoreInfo(id: string, message: string) {
  return (await api.post(`/temp-grievances/${id}/request-more-info`, { message })).data;
}
export async function fetchTempGrievanceDuplicates(id: string) {
  const { data } = await api.get(`/temp-grievances/${id}/duplicates`);
  return data;
}

// ---------- Geo ----------
export interface GeoOptions {
  mandals: { id: string; name: string; constituencyId: string }[];
  villages: { id: string; name: string; mandalId: string }[];
}
export async function fetchGeoOptions(): Promise<GeoOptions> {
  const { data } = await api.get('/geo/options');
  return data;
}

// ---------- Cadre ----------
export interface CadreListItem {
  id: string;
  name: string;
  mobile: string;
  designation: string;
  level: string;
  status: string;
  performance: number;
  mandal?: { name: string } | null;
}
export async function fetchCadres(filters: {
  page?: number;
  search?: string;
}): Promise<Paginated<CadreListItem>> {
  const { data } = await api.get('/cadre', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

// ---------- Citizens ----------
export interface CitizenListItem {
  id: string;
  name: string;
  mobile?: string | null;
  gender?: string | null;
  age?: number | null;
  voterId?: string | null;
  status: string;
  mandal?: { name: string } | null;
  village?: { name: string } | null;
}
export async function fetchCitizens(filters: {
  page?: number;
  search?: string;
}): Promise<Paginated<CitizenListItem>> {
  const { data } = await api.get('/citizens', { params: clean({ ...filters, limit: 20 }) });
  return data;
}
export interface CitizenDetail extends CitizenListItem {
  email?: string | null;
  occupation?: string | null;
  caste?: string | null;
  religion?: string | null;
  address?: string | null;
  dob?: string | null;
}
export async function fetchCitizen(id: string): Promise<CitizenDetail> {
  const { data } = await api.get(`/citizens/${id}`);
  return data;
}
export async function updateCitizen(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/citizens/${id}`, clean(payload))).data;
}

// ---------- Schemes / eligibility ----------
export interface EligibilityResult {
  schemeId: string;
  name: string;
  category?: string | null;
  benefitAmount?: number | null;
  eligible: boolean;
  reasons: string[];
}
export async function checkEligibility(input: Record<string, unknown>): Promise<EligibilityResult[]> {
  const { data } = await api.post('/schemes/eligibility', input);
  return data;
}

// ---------- Events ----------
export interface EventListItem {
  id: string;
  title: string;
  type: string;
  status: string;
  startAt: string;
  venue?: string | null;
  expectedAttendees: number;
  mandal?: { name: string } | null;
  _count: { attendees: number };
}
export async function fetchEvents(filters: {
  page?: number;
  search?: string;
}): Promise<Paginated<EventListItem>> {
  const { data } = await api.get('/events', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

// ---------- Activities ----------
export interface ActivityListItem {
  id: string;
  code?: string | null;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  direction?: string | null;
  outcome?: string | null;
  durationSec?: number | null;
  scheduledAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  contactName?: string | null;
  contactMobile?: string | null;
  locationName?: string | null;
  citizen?: { id: string; name: string } | null;
  assignedToUser?: { id: string; name: string } | null;
  createdAt: string;
}
export interface ActivityNoteItem {
  id: string;
  action: string;
  toStatus?: string | null;
  note?: string | null;
  byName?: string | null;
  createdAt: string;
}
export interface ActivityDetail extends ActivityListItem {
  recordingUrl?: string | null;
  mandal?: { id: string; name: string } | null;
  grievance?: { id: string; code: string; title: string; status: string } | null;
  participants: { id: string; name?: string | null; role?: string | null; status: string; cadre?: { name: string } | null; citizen?: { name: string } | null }[];
  notes: ActivityNoteItem[];
  reminders: { id: string; remindAt: string; sent: boolean }[];
}
export interface ActivityStats {
  total: number;
  today: number;
  overdue: number;
  upcoming: number;
  completed: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}
export interface ActivityOptions {
  users: { id: string; name: string }[];
  cadres: { id: string; name: string; designation: string }[];
  campaigns: { id: string; name: string; type: string; status: string }[];
  mandals: { id: string; name: string; constituencyId: string }[];
}
export async function fetchActivities(filters: {
  page?: number;
  search?: string;
  type?: string;
  status?: string;
  scope?: string;
}): Promise<Paginated<ActivityListItem>> {
  const { data } = await api.get('/activities', { params: clean({ ...filters, limit: 20 }) });
  return data;
}
export async function fetchActivity(id: string): Promise<ActivityDetail> {
  const { data } = await api.get(`/activities/${id}`);
  return data;
}
export async function fetchActivityStats(type?: string): Promise<ActivityStats> {
  const { data } = await api.get('/activities/stats', { params: clean({ type }) });
  return data;
}
export async function fetchActivityOptions(): Promise<ActivityOptions> {
  const { data } = await api.get('/activities/options');
  return data;
}
export async function createActivity(payload: Record<string, unknown>) {
  return (await api.post('/activities', payload)).data;
}
export async function updateActivity(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/activities/${id}`, clean(payload))).data;
}
export async function completeActivity(id: string, payload: Record<string, unknown> = {}) {
  return (await api.post(`/activities/${id}/complete`, payload)).data;
}
export async function addActivityNote(id: string, note: string) {
  return (await api.post(`/activities/${id}/notes`, { note })).data;
}
export interface CalendarItem {
  id: string;
  kind: 'activity' | 'event';
  title: string;
  type: string;
  status: string;
  date: string | null;
}
export async function fetchActivityCalendar(params: { from?: string; to?: string }): Promise<{ items: CalendarItem[] }> {
  const { data } = await api.get('/activities/calendar', { params: clean(params) });
  return data;
}

// ---------- Notifications ----------
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  read: boolean;
  createdAt: string;
}
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get('/notifications');
  return data;
}
export async function fetchUnreadCount(): Promise<{ count: number }> {
  const { data } = await api.get('/notifications/unread-count');
  return data;
}
export async function markNotificationRead(id: string) {
  return (await api.post(`/notifications/${id}/read`)).data;
}
export async function markAllNotificationsRead() {
  return (await api.post('/notifications/read-all')).data;
}
