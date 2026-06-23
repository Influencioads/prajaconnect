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

export interface GeoRef {
  id: string;
  name: string;
}
export interface GeoOptions {
  constituencies: { id: string; name: string; districtId: string }[];
  mandals: { id: string; name: string; constituencyId: string }[];
  villages: { id: string; name: string; mandalId: string }[];
  booths: { id: string; name: string; villageId: string }[];
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
  email?: string | null;
  designation: string;
  level: string;
  status: string;
  performance: number;
  address?: string | null;
  notes?: string | null;
  joinedAt: string;
  parentId?: string | null;
  constituencyId?: string | null;
  mandalId?: string | null;
  boothId?: string | null;
  mandal?: GeoRef | null;
  constituency?: GeoRef | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  parent?: { id: string; name: string; designation: string } | null;
  _count: { children: number; assignedGrievances: number };
}

export interface CadreDetail extends CadreListItem {
  children: {
    id: string;
    name: string;
    designation: string;
    level: string;
    status: string;
    mobile: string;
  }[];
  assignedGrievances: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }[];
  organizedEvents: {
    id: string;
    title: string;
    type: string;
    status: string;
    startAt: string;
  }[];
}

export interface CadreStats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
}

export interface CadreFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  level?: string;
  mandalId?: string;
  boothId?: string;
}

export async function fetchCadre(filters: CadreFilters): Promise<Paginated<CadreListItem>> {
  const { data } = await api.get('/cadre', { params: cleanParams(filters) });
  return data;
}
export async function fetchCadreStats(): Promise<CadreStats> {
  const { data } = await api.get('/cadre/stats');
  return data;
}
export async function fetchCadreDetail(id: string): Promise<CadreDetail> {
  const { data } = await api.get(`/cadre/${id}`);
  return data;
}
export async function fetchCadreHierarchy(): Promise<CadreHierarchyNode[]> {
  const { data } = await api.get('/cadre/hierarchy');
  return data;
}
export async function fetchCadreParents(exclude?: string) {
  const { data } = await api.get('/cadre/parent-options', { params: { exclude } });
  return data as { id: string; name: string; designation: string; level: string }[];
}
export async function createCadre(payload: Record<string, unknown>) {
  const { data } = await api.post('/cadre', payload);
  return data;
}
export async function updateCadre(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/cadre/${id}`, payload);
  return data;
}
export async function deleteCadre(id: string) {
  const { data } = await api.delete(`/cadre/${id}`);
  return data;
}

export interface CadreHierarchyNode {
  id: string;
  name: string;
  designation: string;
  level: string;
  status: string;
  parentId?: string | null;
  mandal?: { name: string } | null;
  booth?: { number: string } | null;
  _count: { children: number };
  children: CadreHierarchyNode[];
}

// ---------- Citizens ----------
export interface CitizenListItem {
  id: string;
  name: string;
  mobile?: string | null;
  gender?: string | null;
  age?: number | null;
  voterId?: string | null;
  occupation?: string | null;
  category?: string | null;
  status: string;
  isFamilyHead: boolean;
  mandalId?: string | null;
  villageId?: string | null;
  boothId?: string | null;
  familyId?: string | null;
  mandal?: GeoRef | null;
  village?: GeoRef | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  family?: { id: string; headName: string } | null;
  _count: { grievances: number; beneficiaries: number };
}

export interface CitizenDetail extends CitizenListItem {
  dob?: string | null;
  aadhaarMasked?: string | null;
  address?: string | null;
  notes?: string | null;
  constituency?: GeoRef | null;
  family?: {
    id: string;
    headName: string;
    address?: string | null;
    rationCard?: string | null;
    members: { id: string; name: string; gender?: string | null; age?: number | null; isFamilyHead: boolean }[];
  } | null;
  grievances: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }[];
  beneficiaries: {
    id: string;
    status: string;
    appliedAt: string;
    disbursedAmount?: number | null;
    scheme: { id: string; name: string; code: string };
  }[];
  eventAttendees: {
    id: string;
    checkedInAt?: string | null;
    event: { id: string; title: string; startAt: string };
  }[];
}

export interface CitizenStats {
  total: number;
  active: number;
  male: number;
  female: number;
  families: number;
}

export interface CitizenFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  mandalId?: string;
  villageId?: string;
  boothId?: string;
  familyId?: string;
}

export async function fetchCitizens(filters: CitizenFilters): Promise<Paginated<CitizenListItem>> {
  const { data } = await api.get('/citizens', { params: cleanParams(filters) });
  return data;
}
export async function fetchCitizenStats(): Promise<CitizenStats> {
  const { data } = await api.get('/citizens/stats');
  return data;
}
export async function fetchCitizenDetail(id: string): Promise<CitizenDetail> {
  const { data } = await api.get(`/citizens/${id}`);
  return data;
}
export async function fetchFamilies(search?: string) {
  const { data } = await api.get('/citizens/families', { params: { search } });
  return data as {
    id: string;
    headName: string;
    address?: string | null;
    rationCard?: string | null;
    _count: { members: number };
  }[];
}
export async function createCitizen(payload: Record<string, unknown>) {
  const { data } = await api.post('/citizens', payload);
  return data;
}
export async function updateCitizen(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/citizens/${id}`, payload);
  return data;
}
export async function deleteCitizen(id: string) {
  const { data } = await api.delete(`/citizens/${id}`);
  return data;
}

// ---------- Grievances ----------
export interface GrievanceListItem {
  id: string;
  code: string;
  title: string;
  category?: string | null;
  channel: string;
  priority: string;
  status: string;
  citizen?: GeoRef | null;
  department?: GeoRef | null;
  assignedOfficial?: GeoRef | null;
  assignedCadre?: GeoRef | null;
  mandal?: GeoRef | null;
  slaDueAt?: string | null;
  slaDays?: number | null;
  resolvedAt?: string | null;
  createdAt: string;
  daysRemaining?: number | null;
  daysOverdue?: number;
  slaStatus?: 'OnTrack' | 'DueSoon' | 'Breached' | 'None';
  seriousness?: { label: string; level: string };
}

export interface GrievanceUpdate {
  id: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  byName?: string | null;
  createdAt: string;
}

export interface GrievanceDetail extends GrievanceListItem {
  description: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  reportedByName?: string | null;
  reportedByMobile?: string | null;
  satisfactionRating?: number | null;
  feedback?: string | null;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
  department?: { id: string; name: string; slaHours: number } | null;
  assignedOfficial?: { id: string; name: string; designation: string; mobile?: string | null } | null;
  assignedCadre?: { id: string; name: string; designation: string } | null;
  village?: GeoRef | null;
  constituency?: GeoRef | null;
  updates: GrievanceUpdate[];
}

export interface GrievanceStats {
  total: number;
  open: number;
  resolved: number;
  overdue: number;
  validationBreached?: number;
  resolutionBreached?: number;
  byStatus: Record<string, number>;
}

export interface GrievanceOptions {
  departments: { id: string; name: string; slaHours: number }[];
  officials: { id: string; name: string; designation: string; departmentId?: string | null }[];
  cadres: { id: string; name: string; designation: string }[];
}

export interface GrievanceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  mandalId?: string;
}

export async function fetchGrievances(
  filters: GrievanceFilters,
): Promise<Paginated<GrievanceListItem>> {
  const { data } = await api.get('/grievances', { params: cleanParams(filters) });
  return data;
}
export async function fetchGrievanceStats(): Promise<GrievanceStats> {
  const { data } = await api.get('/grievances/stats');
  return data;
}

export interface SlaTrackerSummary {
  openValidationViolations: number;
  openResolutionViolations: number;
  totalOpenViolations: number;
  avgOverdueDays: number;
  liveValidationOverdue: number;
  liveResolutionOverdue: number;
  byDepartment: { departmentId: string; name: string; count: number }[];
  byMandal: { mandalId: string; name: string; count: number }[];
}

export interface SlaViolationItem {
  id: string;
  type: 'Validation' | 'Resolution';
  slaDueAt: string;
  breachedAt: string;
  overdueDays: number;
  status: 'Open' | 'Resolved';
  grievance?: {
    id: string;
    code: string;
    title: string;
    status: string;
    department?: GeoRef | null;
    mandal?: GeoRef | null;
    assignedOfficial?: GeoRef | null;
    assignedCadre?: GeoRef | null;
  } | null;
  tempGrievance?: {
    id: string;
    tempTicketId: string;
    issueSummary?: string | null;
    validationStatus: string;
    mandal?: GeoRef | null;
    assignedValidator?: GeoRef | null;
  } | null;
}

export interface SlaViolationFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  departmentId?: string;
  mandalId?: string;
  minOverdueDays?: number;
}

export async function fetchSlaTracker(): Promise<SlaTrackerSummary> {
  const { data } = await api.get('/grievances/sla-tracker');
  return data;
}

export async function fetchSlaViolations(
  filters: SlaViolationFilters,
): Promise<Paginated<SlaViolationItem>> {
  const { data } = await api.get('/grievances/sla-violations', { params: cleanParams(filters) });
  return data;
}

export async function fetchGrievanceOptions(): Promise<GrievanceOptions> {
  const { data } = await api.get('/grievances/options');
  return data;
}
export async function fetchGrievanceDetail(id: string): Promise<GrievanceDetail> {
  const { data } = await api.get(`/grievances/${id}`);
  return data;
}
export async function createGrievance(payload: Record<string, unknown>) {
  const { data } = await api.post('/grievances', payload);
  return data;
}
export async function updateGrievance(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/grievances/${id}`, payload);
  return data;
}
export async function assignGrievance(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/grievances/${id}/assign`, payload);
  return data;
}
export async function changeGrievanceStatus(id: string, status: string, note?: string) {
  const { data } = await api.post(`/grievances/${id}/status`, { status, note });
  return data;
}
export async function addGrievanceNote(id: string, note: string) {
  const { data } = await api.post(`/grievances/${id}/notes`, { note });
  return data;
}
export async function submitGrievanceFeedback(id: string, rating: number, feedback?: string) {
  const { data } = await api.post(`/grievances/${id}/feedback`, { rating, feedback });
  return data;
}

// ---------- Temporary Grievances ----------
export interface TempGrievanceListItem {
  id: string;
  tempTicketId: string;
  source: string;
  citizenName?: string | null;
  mobileNumber?: string | null;
  village?: GeoRef | null;
  mandal?: GeoRef | null;
  issueCategory?: string | null;
  issueSummary?: string | null;
  priority: string;
  validationStatus: string;
  duplicateRiskScore: number;
  duplicateRisk: string;
  assignedValidator?: GeoRef | null;
  createdBy?: GeoRef | null;
  convertedGrievance?: { id: string; code: string } | null;
  validationDueAt?: string | null;
  daysRemaining?: number | null;
  daysOverdue?: number;
  slaStatus?: 'OnTrack' | 'DueSoon' | 'Breached' | 'None';
  createdAt: string;
}

export interface TempGrievanceDetail extends TempGrievanceListItem {
  whatsappNumber?: string | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  wardId?: string | null;
  address?: string | null;
  issueDescription?: string | null;
  originalMessage?: string | null;
  voiceRecordingUrl?: string | null;
  whatsappChatUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  validationChecklist?: Record<string, boolean> | null;
  rejectedReason?: string | null;
  archivedReason?: string | null;
  convertedAt?: string | null;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
  media: { id: string; mediaType: string; mediaUrl: string; fileName?: string | null }[];
  notes: { id: string; note: string; createdAt: string; createdBy?: GeoRef | null }[];
  validationLogs: {
    id: string;
    validationAction: string;
    oldStatus?: string | null;
    newStatus?: string | null;
    remarks?: string | null;
    createdAt: string;
    createdBy?: GeoRef | null;
  }[];
  duplicates: {
    id: string;
    matchedGrievanceId?: string | null;
    matchedTempId?: string | null;
    matchScore: number;
    matchReason?: string | null;
    actionTaken?: string | null;
  }[];
}

export interface TempGrievanceAnalytics {
  total: number;
  pendingValidation: number;
  validatedToday: number;
  converted: number;
  rejectedSpam: number;
  duplicateSuspected: number;
  bySource: Record<string, number>;
  byPriority: Record<string, number>;
  byMandal: { mandalId: string; name: string; count: number }[];
  byVillage: { villageId: string; name: string; count: number }[];
}

export interface TempGrievanceFilters {
  page?: number;
  limit?: number;
  search?: string;
  source?: string;
  status?: string;
  priority?: string;
  mandalId?: string;
  villageId?: string;
  assignedValidatorId?: string;
  duplicateRisk?: string;
  issueCategory?: string;
  from?: string;
  to?: string;
  scope?: string;
}

export async function fetchTempGrievances(filters: TempGrievanceFilters): Promise<Paginated<TempGrievanceListItem>> {
  const { data } = await api.get('/temp-grievances', { params: cleanParams(filters) });
  return data;
}
export async function fetchTempGrievanceAnalytics(): Promise<TempGrievanceAnalytics> {
  const { data } = await api.get('/temp-grievances/analytics');
  return data;
}
export async function fetchTempGrievanceDetail(id: string): Promise<TempGrievanceDetail> {
  const { data } = await api.get(`/temp-grievances/${id}`);
  return data;
}
export async function createTempGrievance(payload: Record<string, unknown>) {
  const { data } = await api.post('/temp-grievances', payload);
  return data;
}
export async function updateTempGrievance(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/temp-grievances/${id}`, payload);
  return data;
}
export async function validateTempGrievance(id: string, checklist: Record<string, boolean>, remarks?: string) {
  const { data } = await api.post(`/temp-grievances/${id}/validate`, { checklist, remarks });
  return data;
}
export async function convertTempGrievance(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/temp-grievances/${id}/convert`, payload);
  return data;
}
export async function rejectTempGrievance(id: string, reason: string) {
  const { data } = await api.post(`/temp-grievances/${id}/reject`, { reason });
  return data;
}
export async function archiveTempGrievance(id: string, reason: string) {
  const { data } = await api.post(`/temp-grievances/${id}/archive`, { reason });
  return data;
}
export async function markTempGrievanceDuplicate(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/temp-grievances/${id}/mark-duplicate`, payload);
  return data;
}
export async function mergeTempGrievance(id: string, targetGrievanceId: string, remarks?: string) {
  const { data } = await api.post(`/temp-grievances/${id}/merge`, { targetGrievanceId, remarks });
  return data;
}
export async function requestTempGrievanceMoreInfo(id: string, message: string) {
  const { data } = await api.post(`/temp-grievances/${id}/request-more-info`, { message });
  return data;
}
export async function assignTempGrievanceValidator(id: string, validatorId: string, note?: string) {
  const { data } = await api.post(`/temp-grievances/${id}/assign-validator`, { validatorId, note });
  return data;
}
export async function addTempGrievanceNote(id: string, note: string) {
  const { data } = await api.post(`/temp-grievances/${id}/notes`, { note });
  return data;
}
export async function fetchTempGrievanceDuplicates(id: string) {
  const { data } = await api.get(`/temp-grievances/${id}/duplicates`);
  return data;
}
export async function fetchTempGrievanceReport(type: string, params?: Record<string, string>) {
  const { data } = await api.get(`/temp-grievances/reports/${type}`, { params });
  return data;
}

// ---------- Departments & Officials ----------
export interface Department {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  slaHours: number;
  _count?: { officials: number; grievances: number };
}
export interface Official {
  id: string;
  name: string;
  designation: string;
  level: string;
  mobile?: string | null;
  email?: string | null;
  office?: string | null;
  jurisdiction?: string | null;
  escalationOrder: number;
  departmentId?: string | null;
  department?: GeoRef | null;
}
export interface OfficialFilters {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  departmentId?: string;
}
export interface EscalationDept {
  id: string;
  name: string;
  slaHours: number;
  levels: {
    id: string;
    name: string;
    designation: string;
    level: string;
    mobile?: string | null;
    escalationOrder: number;
  }[];
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data } = await api.get('/departments');
  return data;
}
export async function createDepartment(payload: Record<string, unknown>) {
  return (await api.post('/departments', payload)).data;
}
export async function updateDepartment(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/departments/${id}`, payload)).data;
}
export async function deleteDepartment(id: string) {
  return (await api.delete(`/departments/${id}`)).data;
}
export async function fetchOfficials(filters: OfficialFilters): Promise<Paginated<Official>> {
  const { data } = await api.get('/officials', { params: cleanParams(filters) });
  return data;
}
export async function fetchEscalation(): Promise<EscalationDept[]> {
  const { data } = await api.get('/officials/escalation');
  return data;
}
export async function createOfficial(payload: Record<string, unknown>) {
  return (await api.post('/officials', payload)).data;
}
export async function updateOfficial(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/officials/${id}`, payload)).data;
}
export async function deleteOfficial(id: string) {
  return (await api.delete(`/officials/${id}`)).data;
}

// ---------- Schemes ----------
export interface SchemeListItem {
  id: string;
  name: string;
  code: string;
  category?: string | null;
  description?: string | null;
  department?: string | null;
  benefitAmount?: number | null;
  status: string;
  eligibility?: Record<string, unknown> | null;
  _count?: { beneficiaries: number };
}
export interface Beneficiary {
  id: string;
  status: string;
  appliedAt: string;
  approvedAt?: string | null;
  disbursedAmount?: number | null;
  notes?: string | null;
  citizen: { id: string; name: string; mobile?: string | null };
}
export interface SchemeDetail extends SchemeListItem {
  beneficiaries: Beneficiary[];
}
export interface SchemeStats {
  schemes: number;
  active: number;
  beneficiaries: number;
  disbursedTotal: number;
}
export interface EligibilityResult {
  schemeId: string;
  name: string;
  code: string;
  category?: string | null;
  benefitAmount?: number | null;
  eligible: boolean;
  reasons: string[];
}

export async function fetchSchemes(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<Paginated<SchemeListItem>> {
  const { data } = await api.get('/schemes', { params: cleanParams(filters) });
  return data;
}
export async function fetchSchemeStats(): Promise<SchemeStats> {
  const { data } = await api.get('/schemes/stats');
  return data;
}
export async function fetchSchemeDetail(id: string): Promise<SchemeDetail> {
  const { data } = await api.get(`/schemes/${id}`);
  return data;
}
export async function createScheme(payload: Record<string, unknown>) {
  return (await api.post('/schemes', payload)).data;
}
export async function updateScheme(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/schemes/${id}`, payload)).data;
}
export async function enrollBeneficiary(schemeId: string, citizenId: string, status?: string) {
  return (await api.post(`/schemes/${schemeId}/beneficiaries`, { citizenId, status })).data;
}
export async function updateBeneficiary(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/beneficiaries/${id}`, payload)).data;
}
export async function checkEligibility(input: Record<string, unknown>): Promise<EligibilityResult[]> {
  const { data } = await api.post('/schemes/eligibility', input);
  return data;
}

// ---------- WhatsApp ----------
export interface WaConversation {
  id: string;
  contactName?: string | null;
  contactMobile: string;
  unreadCount: number;
  status: string;
  lastMessageAt: string;
  citizen?: GeoRef | null;
  messages: WaMessage[];
  _count?: { messages: number };
}
export interface WaMessage {
  id: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
}
export async function fetchConversations(search?: string): Promise<WaConversation[]> {
  const { data } = await api.get('/whatsapp/conversations', { params: { search } });
  return data;
}
export async function fetchConversation(id: string): Promise<WaConversation> {
  const { data } = await api.get(`/whatsapp/conversations/${id}`);
  return data;
}
export async function sendWaMessage(id: string, body: string) {
  return (await api.post(`/whatsapp/conversations/${id}/messages`, { body })).data;
}
export async function sendBroadcast(body: string, audience?: string) {
  return (await api.post('/whatsapp/broadcast', { body, audience })).data;
}

// ---------- Notifications ----------
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
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

// ---------- Events ----------
export interface EventListItem {
  id: string;
  title: string;
  type: string;
  status: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  venue?: string | null;
  expectedAttendees: number;
  qrToken?: string | null;
  mandal?: GeoRef | null;
  organizer?: GeoRef | null;
  _count: { attendees: number };
}
export interface EventAttendee {
  id: string;
  name?: string | null;
  mobile?: string | null;
  checkedInAt?: string | null;
  method?: string | null;
  citizen?: GeoRef | null;
}
export interface EventDetail extends EventListItem {
  village?: GeoRef | null;
  constituency?: GeoRef | null;
  attendees: EventAttendee[];
}
export interface EventStats {
  total: number;
  upcoming: number;
  completed: number;
  checkedIn: number;
}
export interface EventFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  mandalId?: string;
}
export async function fetchEvents(filters: EventFilters): Promise<Paginated<EventListItem>> {
  const { data } = await api.get('/events', { params: cleanParams(filters) });
  return data;
}
export async function fetchEventStats(): Promise<EventStats> {
  const { data } = await api.get('/events/stats');
  return data;
}
export async function fetchEventDetail(id: string): Promise<EventDetail> {
  const { data } = await api.get(`/events/${id}`);
  return data;
}
export async function createEvent(payload: Record<string, unknown>) {
  return (await api.post('/events', payload)).data;
}
export async function updateEvent(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/events/${id}`, payload)).data;
}
export async function checkInAttendee(id: string, payload: Record<string, unknown>) {
  return (await api.post(`/events/${id}/checkin`, payload)).data;
}

// ---------- Surveys ----------
export interface SurveyQuestion {
  id: string;
  type: 'single' | 'multi' | 'rating' | 'text';
  text: string;
  options?: string[];
}
export interface SurveyListItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  _count: { responses: number };
}
export interface SurveyAggregate {
  id: string;
  text: string;
  type: string;
  distribution?: Record<string, number>;
  average?: number;
  samples?: string[];
}
export interface SurveyResponseItem {
  id: string;
  respondentName?: string | null;
  answers: Record<string, unknown>;
  submittedAt: string;
}
export interface SurveyDetail extends SurveyListItem {
  questions: SurveyQuestion[];
  aggregates: SurveyAggregate[];
  responses: SurveyResponseItem[];
}
export interface SurveyStats {
  total: number;
  active: number;
  responses: number;
}
export async function fetchSurveys(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<Paginated<SurveyListItem>> {
  const { data } = await api.get('/surveys', { params: cleanParams(filters) });
  return data;
}
export async function fetchSurveyStats(): Promise<SurveyStats> {
  const { data } = await api.get('/surveys/stats');
  return data;
}
export async function fetchSurveyDetail(id: string): Promise<SurveyDetail> {
  const { data } = await api.get(`/surveys/${id}`);
  return data;
}
export async function createSurvey(payload: Record<string, unknown>) {
  return (await api.post('/surveys', payload)).data;
}
export async function updateSurvey(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/surveys/${id}`, payload)).data;
}
export async function submitSurveyResponse(id: string, payload: Record<string, unknown>) {
  return (await api.post(`/surveys/${id}/responses`, payload)).data;
}

// ---------- Development Projects ----------
export interface ProjectListItem {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  status: string;
  budget: number;
  spent: number;
  progressPct: number;
  contractor?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  mandal?: GeoRef | null;
  department?: GeoRef | null;
}
export interface ProjectDetail extends ProjectListItem {
  village?: GeoRef | null;
  constituency?: GeoRef | null;
  completedAt?: string | null;
}
export interface ProjectStats {
  total: number;
  totalBudget: number;
  totalSpent: number;
  avgProgress: number;
  byStatus: Record<string, number>;
}
export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  mandalId?: string;
}
export async function fetchProjects(filters: ProjectFilters): Promise<Paginated<ProjectListItem>> {
  const { data } = await api.get('/projects', { params: cleanParams(filters) });
  return data;
}
export async function fetchProjectStats(): Promise<ProjectStats> {
  const { data } = await api.get('/projects/stats');
  return data;
}
export async function fetchProjectDetail(id: string): Promise<ProjectDetail> {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}
export async function createProject(payload: Record<string, unknown>) {
  return (await api.post('/projects', payload)).data;
}
export async function updateProject(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/projects/${id}`, payload)).data;
}

// ---------- GIS ----------
export interface GrievancePoint {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  category?: string | null;
  lat: number;
  lng: number;
  mandal?: string | null;
}
export interface MandalSummary {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  grievances: number;
  openGrievances: number;
  citizens: number;
  cadres: number;
}
export async function fetchGrievancePoints(): Promise<GrievancePoint[]> {
  const { data } = await api.get('/gis/grievances');
  return data;
}
export async function fetchMandalSummary(): Promise<MandalSummary[]> {
  const { data } = await api.get('/gis/mandals');
  return data;
}

// ---------- AI Command Center ----------
export type ScoreBand = 'Critical' | 'At Risk' | 'Stable' | 'Strong';
export interface ScoreComponent {
  label: string;
  value: number;
  weight: number;
}
export interface ScoreCard {
  score: number;
  band: ScoreBand;
  components: ScoreComponent[];
}
export interface ReadinessCard extends ScoreCard {
  boothsTotal: number;
  boothsCovered: number;
}
export interface SentimentCard extends ScoreCard {
  sampleSize: number;
  surveyResponses: number;
  avgRating: number;
}
export interface SlaAlert {
  id: string;
  code: string;
  title: string;
  priority: string;
  status: string;
  mandal: string | null;
  department: string | null;
  overdueDays: number;
  severity: 'High' | 'Medium' | 'Low';
}
export interface HotspotAlert {
  mandal: string;
  openGrievances: number;
  severity: 'High' | 'Medium' | 'Low';
}
export interface RiskAlerts {
  slaAlerts: SlaAlert[];
  hotspotAlerts: HotspotAlert[];
  slaBreachCount: number;
}
export interface DailyBriefing {
  date: string;
  generatedBy: string;
  headlines: string[];
  metrics: {
    newGrievances: number;
    resolvedToday: number;
    upcomingEvents: number;
    newBeneficiaries: number;
    healthScore: number;
  };
  note: string;
}
export interface PrBriefing {
  available: boolean;
  openPrAlerts?: number;
  reportId?: string;
  periodStart?: string;
  periodEnd?: string;
  summary?: string;
  mustCover?: unknown;
  negativePr?: unknown;
  stats?: unknown;
  generatedAt?: string;
}
export interface AiOverview {
  health: ScoreCard;
  readiness: ReadinessCard;
  sentiment: SentimentCard;
  alerts: RiskAlerts;
  briefing: DailyBriefing;
  prBriefing: PrBriefing;
}
export async function fetchAiOverview(): Promise<AiOverview> {
  const { data } = await api.get('/ai/overview');
  return data;
}

// ---------- Reports ----------
export interface ReportDefinition {
  type: string;
  label: string;
  description: string;
}
export interface ReportsSummary {
  counts: Record<string, number>;
  reports: ReportDefinition[];
}
export async function fetchReportsSummary(): Promise<ReportsSummary> {
  const { data } = await api.get('/reports');
  return data;
}
export async function downloadReportCsv(type: string): Promise<void> {
  const res = await api.get(`/reports/export/${type}`, { responseType: 'blob' });
  const disposition = (res.headers['content-disposition'] as string | undefined) ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `${type}.csv`;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// ---------- Activities ----------
export interface ActivityRef {
  id: string;
  name: string;
}
export interface ActivityListItem {
  id: string;
  code?: string | null;
  type: string;
  subType?: string | null;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  direction?: string | null;
  outcome?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSec?: number | null;
  dueAt?: string | null;
  completedAt?: string | null;
  reminderAt?: string | null;
  recordingUrl?: string | null;
  contactName?: string | null;
  contactMobile?: string | null;
  locationName?: string | null;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
  cadre?: { id: string; name: string; designation: string } | null;
  official?: { id: string; name: string; designation: string } | null;
  assignedToUser?: ActivityRef | null;
  campaign?: { id: string; name: string; type: string } | null;
  mandal?: ActivityRef | null;
  createdAt: string;
  _count?: { participants: number; notes: number; reminders: number };
}
export interface ActivityParticipant {
  id: string;
  name?: string | null;
  mobile?: string | null;
  role?: string | null;
  status: string;
  joinedAt?: string | null;
  citizen?: ActivityRef | null;
  cadre?: ActivityRef | null;
  user?: ActivityRef | null;
}
export interface ActivityNote {
  id: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  byName?: string | null;
  createdAt: string;
}
export interface ActivityReminder {
  id: string;
  remindAt: string;
  note?: string | null;
  sent: boolean;
  sentAt?: string | null;
}
export interface ActivityDetail extends ActivityListItem {
  metadata?: Record<string, unknown> | null;
  mediaUrls?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  createdBy?: ActivityRef | null;
  event?: { id: string; title: string; startAt: string } | null;
  grievance?: { id: string; code: string; title: string; status: string } | null;
  survey?: { id: string; title: string } | null;
  village?: ActivityRef | null;
  constituency?: ActivityRef | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  participants: ActivityParticipant[];
  notes: ActivityNote[];
  reminders: ActivityReminder[];
}
export interface ActivityStats {
  total: number;
  today: number;
  overdue: number;
  upcoming: number;
  completed: number;
  durationTotalSec: number;
  durationAvgSec: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byOutcome: Record<string, number>;
}
export interface ActivityOptions {
  users: { id: string; name: string; designation?: string | null }[];
  cadres: { id: string; name: string; designation: string }[];
  campaigns: { id: string; name: string; type: string; status: string }[];
  mandals: { id: string; name: string; constituencyId: string }[];
}
export interface ActivityFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  priority?: string;
  direction?: string;
  assignedToUserId?: string;
  citizenId?: string;
  cadreId?: string;
  campaignId?: string;
  grievanceId?: string;
  mandalId?: string;
  outcome?: string;
  from?: string;
  to?: string;
  scope?: string;
}
export interface CalendarItem {
  id: string;
  kind: 'activity' | 'event';
  title: string;
  type: string;
  status: string;
  priority?: string | null;
  date: string | null;
}
export interface TimelineItem {
  id: string;
  kind: 'activity' | 'whatsapp';
  type: string;
  title: string;
  body: string;
  status?: string;
  direction?: string | null;
  date: string;
}
export interface ActivityCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string | null;
  script?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  targetCount: number;
  reachedCount: number;
  responseCount: number;
  conversionCount: number;
  budget: number;
  spent: number;
  mandal?: ActivityRef | null;
  _count?: { activities: number };
  createdAt: string;
}
export interface CampaignMetrics {
  campaign: ActivityCampaign;
  total: number;
  reached: number;
  byStatus: Record<string, number>;
  byOutcome: Record<string, number>;
  conversionRate: number;
}

export async function fetchActivities(filters: ActivityFilters): Promise<Paginated<ActivityListItem>> {
  const { data } = await api.get('/activities', { params: cleanParams(filters) });
  return data;
}
export async function fetchActivityStats(type?: string): Promise<ActivityStats> {
  const { data } = await api.get('/activities/stats', { params: cleanParams({ type }) });
  return data;
}
export async function fetchActivityOptions(): Promise<ActivityOptions> {
  const { data } = await api.get('/activities/options');
  return data;
}
export async function fetchActivityDetail(id: string): Promise<ActivityDetail> {
  const { data } = await api.get(`/activities/${id}`);
  return data;
}
export async function createActivity(payload: Record<string, unknown>) {
  return (await api.post('/activities', payload)).data;
}
export async function updateActivity(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/activities/${id}`, payload)).data;
}
export async function deleteActivity(id: string) {
  return (await api.delete(`/activities/${id}`)).data;
}
export async function changeActivityStatus(id: string, status: string, note?: string) {
  return (await api.post(`/activities/${id}/status`, { status, note })).data;
}
export async function completeActivity(id: string, payload: Record<string, unknown>) {
  return (await api.post(`/activities/${id}/complete`, payload)).data;
}
export async function addActivityNote(id: string, note: string) {
  return (await api.post(`/activities/${id}/notes`, { note })).data;
}
export async function addActivityParticipant(id: string, payload: Record<string, unknown>) {
  return (await api.post(`/activities/${id}/participants`, payload)).data;
}
export async function addActivityReminder(id: string, payload: Record<string, unknown>) {
  return (await api.post(`/activities/${id}/reminders`, payload)).data;
}
export async function fetchActivityCalendar(params: { from?: string; to?: string; type?: string }): Promise<{ from: string; to: string; items: CalendarItem[] }> {
  const { data } = await api.get('/activities/calendar', { params: cleanParams(params) });
  return data;
}
export async function fetchActivityTimeline(params: { citizenId?: string; cadreId?: string; limit?: number }): Promise<{ items: TimelineItem[] }> {
  const { data } = await api.get('/activities/timeline', { params: cleanParams(params) });
  return data;
}
export async function fetchCampaigns(filters: { page?: number; limit?: number; search?: string; type?: string; status?: string }): Promise<Paginated<ActivityCampaign>> {
  const { data } = await api.get('/activities/campaigns', { params: cleanParams(filters) });
  return data;
}
export async function fetchCampaign(id: string): Promise<ActivityCampaign> {
  const { data } = await api.get(`/activities/campaigns/${id}`);
  return data;
}
export async function fetchCampaignMetrics(id: string): Promise<CampaignMetrics> {
  const { data } = await api.get(`/activities/campaigns/${id}/metrics`);
  return data;
}
export async function createCampaign(payload: Record<string, unknown>) {
  return (await api.post('/activities/campaigns', payload)).data;
}
export async function updateCampaign(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/activities/campaigns/${id}`, payload)).data;
}
export interface ActivityReportDefinition {
  type: string;
  label: string;
  description: string;
}
export interface ActivityReportsSummary {
  counts: Record<string, number>;
  reports: ActivityReportDefinition[];
}
export async function fetchActivityReports(): Promise<ActivityReportsSummary> {
  const { data } = await api.get('/activities/reports');
  return data;
}
export async function downloadActivityReportCsv(type: string): Promise<void> {
  const res = await api.get(`/activities/reports/export/${type}`, { responseType: 'blob' });
  const disposition = (res.headers['content-disposition'] as string | undefined) ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `activities-${type}.csv`;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function cleanParams(obj: object) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

// ---------- Committees & Network ----------
export const NETWORK_RESOURCES = {
  committeeMembers: 'committee-members',
  observers: 'observers',
  impLeaders: 'imp-leaders',
  influencers: 'influencers',
  press: 'press',
} as const;

export type NetworkResource =
  | 'committee-members'
  | 'observers'
  | 'imp-leaders'
  | 'influencers'
  | 'press';

export interface NetworkActivity {
  id: string;
  action: string;
  note?: string | null;
  byName?: string | null;
  createdAt: string;
}

export interface NetworkRecord {
  id: string;
  fullName: string;
  mobile: string;
  whatsapp?: string | null;
  email?: string | null;
  photo?: string | null;
  gender?: string | null;
  age?: number | null;
  designation?: string | null;
  categoryType?: string | null;
  wardNumber?: string | null;
  boothNumber?: string | null;
  address?: string | null;
  politicalInfluenceLevel?: string | null;
  publicReach?: number | null;
  assignedArea?: string | null;
  status: string;
  notes?: string | null;
  mandalId?: string | null;
  villageId?: string | null;
  boothId?: string | null;
  reportingPersonId?: string | null;
  mandal?: GeoRef | null;
  village?: GeoRef | null;
  booth?: { id: string; number: string; name?: string | null } | null;
  reportingPerson?: { id: string; name: string; designation: string } | null;
  activity?: NetworkActivity[];
  createdAt: string;
  updatedAt?: string;
  // category-specific extras are passed through dynamically
  [key: string]: unknown;
}

export interface NetworkStats {
  total: number;
  active: number;
  inactive: number;
}

export interface NetworkFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  mandalId?: string;
  villageId?: string;
  category?: string;
  journalistType?: string;
  [key: string]: unknown;
}

export async function fetchNetworkList(
  resource: NetworkResource,
  filters: NetworkFilters,
): Promise<Paginated<NetworkRecord>> {
  const { data } = await api.get(`/${resource}`, { params: cleanParams(filters) });
  return data;
}

export async function fetchNetworkStats(
  resource: NetworkResource,
  filters: NetworkFilters = {},
): Promise<NetworkStats> {
  const { data } = await api.get(`/${resource}/stats`, { params: cleanParams(filters) });
  return data;
}

export async function fetchNetworkDetail(
  resource: NetworkResource,
  id: string,
): Promise<NetworkRecord> {
  const { data } = await api.get(`/${resource}/${id}`);
  return data;
}

export async function createNetworkRecord(resource: NetworkResource, payload: Record<string, unknown>) {
  const { data } = await api.post(`/${resource}`, payload);
  return data;
}

export async function updateNetworkRecord(
  resource: NetworkResource,
  id: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.patch(`/${resource}/${id}`, payload);
  return data;
}

export async function deleteNetworkRecord(resource: NetworkResource, id: string) {
  const { data } = await api.delete(`/${resource}/${id}`);
  return data;
}

export async function addNetworkActivity(
  resource: NetworkResource,
  id: string,
  payload: { action: string; note?: string; byName?: string },
) {
  const { data } = await api.post(`/${resource}/${id}/activity`, payload);
  return data;
}

export async function importNetworkCsv(
  resource: NetworkResource,
  csv: string,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const { data } = await api.post(`/${resource}/import`, { csv });
  return data;
}

export async function exportNetworkCsv(
  resource: NetworkResource,
  filters: NetworkFilters = {},
): Promise<void> {
  const res = await api.get(`/${resource}/export`, {
    params: cleanParams(filters),
    responseType: 'blob',
  });
  const disposition = (res.headers['content-disposition'] as string | undefined) ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `${resource}.csv`;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export interface CommitteeDef {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  status: string;
  mandal?: GeoRef | null;
  village?: GeoRef | null;
  _count?: { members: number };
}

export async function fetchCommittees(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  mandalId?: string;
}): Promise<Paginated<CommitteeDef>> {
  const { data } = await api.get('/committees', { params: cleanParams(filters) });
  return data;
}

export async function fetchCommitteeOptions(): Promise<
  { id: string; name: string; category: string }[]
> {
  const { data } = await api.get('/committees/options');
  return data;
}

export async function createCommittee(payload: Record<string, unknown>) {
  return (await api.post('/committees', payload)).data;
}
export async function updateCommittee(id: string, payload: Record<string, unknown>) {
  return (await api.patch(`/committees/${id}`, payload)).data;
}
export async function deleteCommittee(id: string) {
  return (await api.delete(`/committees/${id}`)).data;
}

export interface CommitteeAnalytics {
  totals: {
    mandalCommittee: number;
    villageCommittee: number;
    coordinationCommittee: number;
    mandalCoordinationCommittee: number;
    committeeMembers: number;
    observers: number;
    impLeaders: number;
    influencers: number;
    press: number;
    totalNetwork: number;
  };
  activeVsInactive: { active: number; inactive: number };
  byCategory: { category: string; count: number }[];
  mandalStrength: {
    mandal: string;
    committeeMembers: number;
    observers: number;
    impLeaders: number;
    influencers: number;
    press: number;
    total: number;
  }[];
  villageCoverage: { village: string; members: number; committees: number; covered: boolean }[];
  influenceScore: {
    impLeaders: { avgVoterInfluence: number; avgCommunityReach: number; count: number };
    influencers: { avgEngagementRate: number; totalReach: number; count: number };
    committeeMembers: { avgTaskScore: number; avgAttendance: number; count: number };
  };
}

export async function fetchCommitteeAnalytics(): Promise<CommitteeAnalytics> {
  const { data } = await api.get('/committee-analytics');
  return data;
}

// ---------- Assets ----------
export interface RoadDetail {
  roadType?: string | null;
  lengthKm?: number | null;
  widthM?: number | null;
  lastRepairDate?: string | null;
}
export interface HospitalDetail {
  hospitalType?: string | null;
  doctorsCount?: number | null;
  bedsCount?: number | null;
  ambulances?: number | null;
  emergencyContact?: string | null;
  services?: string | null;
}
export interface SchoolDetail {
  schoolType?: string | null;
  studentCount?: number | null;
  teacherCount?: number | null;
  midDayMeal?: boolean | null;
  performanceScore?: number | null;
}
export interface RwsDetail {
  assetType?: string | null;
  functional?: boolean | null;
  distributionStatus?: string | null;
}

export interface AssetListItem {
  id: string;
  category: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  condition?: string | null;
  contractor?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  wardNumber?: string | null;
  villageId?: string | null;
  mandalId?: string | null;
  constituencyId?: string | null;
  departmentId?: string | null;
  projectId?: string | null;
  attributes?: Record<string, unknown> | null;
  mandal?: GeoRef | null;
  village?: GeoRef | null;
  department?: GeoRef | null;
  road?: RoadDetail | null;
  hospital?: HospitalDetail | null;
  school?: SchoolDetail | null;
  rws?: RwsDetail | null;
  createdAt: string;
  updatedAt: string;
  _count?: { photos: number; documents: number; logs: number; grievances: number };
}

export interface AssetPhotoItem {
  id: string;
  url: string;
  label?: string | null;
  mimeType?: string | null;
  createdAt: string;
}
export type AssetDocumentItem = AssetPhotoItem;
export interface AssetLogItem {
  id: string;
  type: string;
  note?: string | null;
  status?: string | null;
  cost?: number | null;
  performedBy?: string | null;
  performedAt: string;
}

export interface AssetDetail extends AssetListItem {
  constituency?: GeoRef | null;
  project?: { id: string; name: string; status: string } | null;
  photos: AssetPhotoItem[];
  documents: AssetDocumentItem[];
  logs: AssetLogItem[];
  grievances: { id: string; code: string; title: string; status: string }[];
}

export interface AssetFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  mandalId?: string;
  villageId?: string;
  departmentId?: string;
}

export interface AssetStats {
  category?: string;
  total: number;
  byStatus?: Record<string, number>;
  byCondition?: Record<string, number>;
  byMandal?: Record<string, number>;
  byCategory?: Record<string, number>;
  underMaintenance?: number;
  underDevelopment?: number;
  detail?: Record<string, unknown>;
}

export interface AssetGisPoint {
  id: string;
  name: string;
  code: string;
  category: string;
  status: string;
  condition?: string | null;
  lat: number;
  lng: number;
  mandal?: string | null;
}

export interface AssetOptions {
  departments: GeoRef[];
  projects: GeoRef[];
}

export async function fetchAssets(filters: AssetFilters): Promise<Paginated<AssetListItem>> {
  const { data } = await api.get('/assets', { params: cleanParams(filters) });
  return data;
}
export async function fetchAsset(id: string): Promise<AssetDetail> {
  const { data } = await api.get(`/assets/${id}`);
  return data;
}
export async function fetchAssetStats(category?: string): Promise<AssetStats> {
  const { data } = await api.get('/assets/stats', { params: cleanParams({ category }) });
  return data;
}
export async function fetchAssetGisPoints(category?: string): Promise<AssetGisPoint[]> {
  const { data } = await api.get('/assets/gis', { params: cleanParams({ category }) });
  return data;
}
export async function fetchAssetOptions(): Promise<AssetOptions> {
  const { data } = await api.get('/assets/options');
  return data;
}
export async function createAsset(payload: Record<string, unknown>) {
  const { data } = await api.post('/assets', payload);
  return data;
}
export async function updateAsset(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/assets/${id}`, payload);
  return data;
}
export async function deleteAsset(id: string) {
  const { data } = await api.delete(`/assets/${id}`);
  return data;
}
export async function addAssetLog(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/assets/${id}/logs`, payload);
  return data;
}
export async function addAssetPhoto(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/assets/${id}/photos`, payload);
  return data;
}
export async function removeAssetPhoto(id: string, photoId: string) {
  const { data } = await api.delete(`/assets/${id}/photos/${photoId}`);
  return data;
}
export async function addAssetDocument(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/assets/${id}/documents`, payload);
  return data;
}
export async function removeAssetDocument(id: string, documentId: string) {
  const { data } = await api.delete(`/assets/${id}/documents/${documentId}`);
  return data;
}
export async function importAssetsCsv(csv: string, category?: string) {
  const { data } = await api.post('/assets/import', { csv, category });
  return data;
}
export async function uploadFile(file: File): Promise<{ url: string; filename: string; mimeType: string; size: number }> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}
export async function downloadAssetsCsv(category?: string): Promise<void> {
  const res = await api.get('/assets/export', { params: cleanParams({ category }), responseType: 'blob' });
  const disposition = (res.headers['content-disposition'] as string | undefined) ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `assets-${category ?? 'all'}.csv`;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
