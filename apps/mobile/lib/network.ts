import { api } from './api';
import type { Paginated } from './crm';

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
  gender?: string | null;
  age?: number | null;
  designation?: string | null;
  categoryType?: string | null;
  address?: string | null;
  politicalInfluenceLevel?: string | null;
  publicReach?: number | null;
  assignedArea?: string | null;
  status: string;
  notes?: string | null;
  mandalId?: string | null;
  villageId?: string | null;
  mandal?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
  activity?: NetworkActivity[];
  createdAt: string;
  [key: string]: unknown;
}

export interface NetworkStats {
  total: number;
  active: number;
  inactive: number;
}

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchNetworkList(
  resource: NetworkResource,
  filters: Record<string, unknown>,
): Promise<Paginated<NetworkRecord>> {
  const { data } = await api.get(`/${resource}`, { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function fetchNetworkStats(
  resource: NetworkResource,
  filters: Record<string, unknown> = {},
): Promise<NetworkStats> {
  const { data } = await api.get(`/${resource}/stats`, { params: clean(filters) });
  return data;
}

export async function fetchNetworkDetail(resource: NetworkResource, id: string): Promise<NetworkRecord> {
  const { data } = await api.get(`/${resource}/${id}`);
  return data;
}

export async function createNetworkRecord(resource: NetworkResource, payload: Record<string, unknown>) {
  return (await api.post(`/${resource}`, payload)).data;
}

export async function updateNetworkRecord(
  resource: NetworkResource,
  id: string,
  payload: Record<string, unknown>,
) {
  return (await api.patch(`/${resource}/${id}`, payload)).data;
}

export async function deleteNetworkRecord(resource: NetworkResource, id: string) {
  return (await api.delete(`/${resource}/${id}`)).data;
}

export async function addNetworkActivity(
  resource: NetworkResource,
  id: string,
  payload: { action: string; note?: string },
) {
  return (await api.post(`/${resource}/${id}/activity`, payload)).data;
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
}

export async function fetchCommitteeAnalytics(): Promise<CommitteeAnalytics> {
  const { data } = await api.get('/committee-analytics');
  return data;
}

// ---- View config ----
export interface NetworkField {
  key: string;
  label: string;
  numeric?: boolean;
  multiline?: boolean;
  options?: string[];
}

export interface NetworkView {
  key: string;
  resource: NetworkResource;
  title: string;
  subtitle: string;
  category?: string;
  extraFields: NetworkField[];
}

const committeeFields: NetworkField[] = [
  { key: 'committeeName', label: 'Committee Name' },
  { key: 'committeeRole', label: 'Committee Role' },
  { key: 'partyPosition', label: 'Party Position' },
  { key: 'attendanceCount', label: 'Attendance Count', numeric: true },
  { key: 'taskCompletionScore', label: 'Task Completion Score', numeric: true },
  { key: 'volunteerStrength', label: 'Volunteer Strength', numeric: true },
  { key: 'boothResponsibility', label: 'Booth Responsibility' },
];

export const NETWORK_VIEWS: Record<string, NetworkView> = {
  'mandal-committee': {
    key: 'mandal-committee',
    resource: 'committee-members',
    title: 'Mandal Committee',
    subtitle: 'Mandal committee members',
    category: 'MandalCommittee',
    extraFields: committeeFields,
  },
  'village-committee': {
    key: 'village-committee',
    resource: 'committee-members',
    title: 'Village Committee',
    subtitle: 'Village committee members',
    category: 'VillageCommittee',
    extraFields: committeeFields,
  },
  'coordination-committee': {
    key: 'coordination-committee',
    resource: 'committee-members',
    title: 'Coordination Committee',
    subtitle: 'Coordination committee members',
    category: 'CoordinationCommittee',
    extraFields: committeeFields,
  },
  'mandal-coordination-committee': {
    key: 'mandal-coordination-committee',
    resource: 'committee-members',
    title: 'Mandal Coordination',
    subtitle: 'Mandal coordination committee',
    category: 'MandalCoordinationCommittee',
    extraFields: committeeFields,
  },
  observers: {
    key: 'observers',
    resource: 'observers',
    title: 'Mandal Observers',
    subtitle: 'Field observers',
    extraFields: [
      { key: 'observationArea', label: 'Observation Area' },
      { key: 'assignedMandals', label: 'Assigned Mandals' },
      { key: 'reportingFrequency', label: 'Reporting Frequency', options: ['Daily', 'Weekly', 'Monthly'] },
      { key: 'performanceRemarks', label: 'Performance Remarks', multiline: true },
      { key: 'issueEscalationCount', label: 'Issue Escalation Count', numeric: true },
    ],
  },
  'imp-leaders': {
    key: 'imp-leaders',
    resource: 'imp-leaders',
    title: 'IMP Leaders',
    subtitle: 'Important community leaders',
    extraFields: [
      { key: 'influenceArea', label: 'Influence Area' },
      { key: 'communityReach', label: 'Community Reach', numeric: true },
      { key: 'voterInfluenceScore', label: 'Voter Influence Score', numeric: true },
      { key: 'keySupportGroups', label: 'Key Support Groups' },
      { key: 'priorityLevel', label: 'Priority Level', options: ['High', 'Medium', 'Low'] },
    ],
  },
  influencers: {
    key: 'influencers',
    resource: 'influencers',
    title: 'Influencers',
    subtitle: 'Social media influencers',
    extraFields: [
      { key: 'platform', label: 'Platform', options: ['Instagram', 'YouTube', 'Facebook', 'X/Twitter'] },
      { key: 'instagramFollowers', label: 'Instagram Followers', numeric: true },
      { key: 'youtubeSubscribers', label: 'YouTube Subscribers', numeric: true },
      { key: 'engagementRate', label: 'Engagement Rate (%)', numeric: true },
      { key: 'contentCategory', label: 'Content Category' },
      { key: 'collaborationStatus', label: 'Collaboration Status' },
    ],
  },
  press: {
    key: 'press',
    resource: 'press',
    title: 'Press',
    subtitle: 'Media & journalist contacts',
    extraFields: [
      { key: 'mediaHouseName', label: 'Media House Name' },
      { key: 'journalistType', label: 'Journalist Type', options: ['Print', 'TV', 'Digital', 'YouTube'] },
      { key: 'beat', label: 'Beat' },
      { key: 'districtCoverage', label: 'District Coverage' },
      { key: 'pressId', label: 'Press ID' },
      { key: 'relationshipStatus', label: 'Relationship Status' },
    ],
  },
};
