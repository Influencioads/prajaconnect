import type { NetworkResource } from '@/lib/crm';

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'date' | 'email';

export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  placeholder?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  /** Render hint: 'badge' | 'number' | default text */
  kind?: 'badge' | 'number' | 'text';
}

export interface NetworkViewConfig {
  key: string;
  resource: NetworkResource;
  title: string;
  description: string;
  /** Committee category to scope committee-members views. */
  category?: string;
  /** Extra table columns shown after the common identity columns. */
  extraColumns: ColumnDef[];
  /** Extra form fields shown after the common fields. */
  extraFields: FieldDef[];
  /** Optional extra filter dropdowns (besides status + mandal). */
  filters?: { key: string; label: string; options: string[] }[];
}

const REPORTING_FREQ = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];
const PRIORITY = ['High', 'Medium', 'Low'];
const PLATFORMS = ['Instagram', 'YouTube', 'Facebook', 'X/Twitter', 'Multiple'];
const JOURNALIST_TYPES = ['Print', 'TV', 'Digital', 'YouTube'];

export const NETWORK_VIEWS: Record<string, NetworkViewConfig> = {
  'mandal-committee': {
    key: 'mandal-committee',
    resource: 'committee-members',
    title: 'Mandal Committee',
    description: 'Mandal-level committee members and office bearers.',
    category: 'MandalCommittee',
    extraColumns: [
      { key: 'committeeRole', label: 'Role' },
      { key: 'attendanceCount', label: 'Attendance', kind: 'number' },
    ],
    extraFields: committeeFields(),
  },
  'village-committee': {
    key: 'village-committee',
    resource: 'committee-members',
    title: 'Village Committee',
    description: 'Village-level committee members and office bearers.',
    category: 'VillageCommittee',
    extraColumns: [
      { key: 'committeeRole', label: 'Role' },
      { key: 'attendanceCount', label: 'Attendance', kind: 'number' },
    ],
    extraFields: committeeFields(),
  },
  'coordination-committee': {
    key: 'coordination-committee',
    resource: 'committee-members',
    title: 'Coordination Committee',
    description: 'Cross-team coordination committee members.',
    category: 'CoordinationCommittee',
    extraColumns: [
      { key: 'committeeRole', label: 'Role' },
      { key: 'taskCompletionScore', label: 'Task Score', kind: 'number' },
    ],
    extraFields: committeeFields(),
  },
  'mandal-coordination-committee': {
    key: 'mandal-coordination-committee',
    resource: 'committee-members',
    title: 'Mandal Coordination Committee',
    description: 'Mandal coordination committee members.',
    category: 'MandalCoordinationCommittee',
    extraColumns: [
      { key: 'committeeRole', label: 'Role' },
      { key: 'taskCompletionScore', label: 'Task Score', kind: 'number' },
    ],
    extraFields: committeeFields(),
  },
  observers: {
    key: 'observers',
    resource: 'observers',
    title: 'Mandal Observers',
    description: 'Field observers monitoring mandal-level activity.',
    extraColumns: [
      { key: 'observationArea', label: 'Observation Area' },
      { key: 'reportingFrequency', label: 'Frequency' },
      { key: 'issueEscalationCount', label: 'Escalations', kind: 'number' },
    ],
    extraFields: [
      { key: 'observationArea', label: 'Observation Area' },
      { key: 'assignedMandals', label: 'Assigned Mandals' },
      { key: 'reportingFrequency', label: 'Reporting Frequency', type: 'select', options: REPORTING_FREQ },
      { key: 'performanceRemarks', label: 'Performance Remarks', type: 'textarea' },
      { key: 'issueEscalationCount', label: 'Issue Escalation Count', type: 'number' },
    ],
  },
  'imp-leaders': {
    key: 'imp-leaders',
    resource: 'imp-leaders',
    title: 'IMP Leaders',
    description: 'Important community and opinion leaders.',
    extraColumns: [
      { key: 'influenceArea', label: 'Influence Area' },
      { key: 'priorityLevel', label: 'Priority', kind: 'badge' },
      { key: 'voterInfluenceScore', label: 'Voter Score', kind: 'number' },
    ],
    extraFields: [
      { key: 'influenceArea', label: 'Influence Area' },
      { key: 'communityReach', label: 'Community Reach', type: 'number' },
      { key: 'voterInfluenceScore', label: 'Voter Influence Score (0-100)', type: 'number' },
      { key: 'keySupportGroups', label: 'Key Support Groups' },
      { key: 'priorityLevel', label: 'Priority Level', type: 'select', options: PRIORITY },
    ],
  },
  influencers: {
    key: 'influencers',
    resource: 'influencers',
    title: 'Influencers',
    description: 'Social media influencers and content creators.',
    extraColumns: [
      { key: 'platform', label: 'Platform', kind: 'badge' },
      { key: 'instagramFollowers', label: 'Instagram', kind: 'number' },
      { key: 'engagementRate', label: 'Engagement %', kind: 'number' },
    ],
    extraFields: [
      { key: 'platform', label: 'Platform', type: 'select', options: PLATFORMS },
      { key: 'instagramFollowers', label: 'Instagram Followers', type: 'number' },
      { key: 'facebookFollowers', label: 'Facebook Followers', type: 'number' },
      { key: 'youtubeSubscribers', label: 'YouTube Subscribers', type: 'number' },
      { key: 'twitterFollowers', label: 'X/Twitter Followers', type: 'number' },
      { key: 'engagementRate', label: 'Engagement Rate (%)', type: 'number' },
      { key: 'contentCategory', label: 'Content Category' },
      { key: 'politicalAlignment', label: 'Political Alignment' },
      { key: 'collaborationStatus', label: 'Collaboration Status' },
    ],
  },
  press: {
    key: 'press',
    resource: 'press',
    title: 'Press',
    description: 'Press, media houses and journalist contacts.',
    extraColumns: [
      { key: 'mediaHouseName', label: 'Media House' },
      { key: 'journalistType', label: 'Type', kind: 'badge' },
      { key: 'beat', label: 'Beat' },
    ],
    filters: [{ key: 'journalistType', label: 'Type', options: JOURNALIST_TYPES }],
    extraFields: [
      { key: 'mediaHouseName', label: 'Media House Name' },
      { key: 'journalistType', label: 'Journalist Type', type: 'select', options: JOURNALIST_TYPES },
      { key: 'beat', label: 'Beat' },
      { key: 'districtCoverage', label: 'District Coverage' },
      { key: 'mandalCoverage', label: 'Mandal Coverage' },
      { key: 'pressId', label: 'Press ID' },
      { key: 'relationshipStatus', label: 'Relationship Status' },
      { key: 'lastInteractionDate', label: 'Last Interaction Date', type: 'date' },
    ],
  },
};

export const NETWORK_VIEW_KEYS = Object.keys(NETWORK_VIEWS);

function committeeFields(): FieldDef[] {
  return [
    { key: 'committeeName', label: 'Committee Name' },
    { key: 'committeeRole', label: 'Committee Role' },
    { key: 'partyPosition', label: 'Party Position' },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
    { key: 'attendanceCount', label: 'Attendance Count', type: 'number' },
    { key: 'taskCompletionScore', label: 'Task Completion Score (0-100)', type: 'number' },
    { key: 'volunteerStrength', label: 'Volunteer Strength', type: 'number' },
    { key: 'boothResponsibility', label: 'Booth Responsibility' },
  ];
}

/** Common fields rendered for every network entity form. */
export const COMMON_FIELDS: FieldDef[] = [
  { key: 'fullName', label: 'Full Name *', placeholder: 'Ravi Kumar' },
  { key: 'mobile', label: 'Mobile Number *', placeholder: '9876543210' },
  { key: 'whatsapp', label: 'WhatsApp Number' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'designation', label: 'Designation' },
  { key: 'categoryType', label: 'Category Type' },
  { key: 'wardNumber', label: 'Ward Number' },
  { key: 'boothNumber', label: 'Booth Number' },
  { key: 'politicalInfluenceLevel', label: 'Political Influence Level', type: 'select', options: ['High', 'Medium', 'Low'] },
  { key: 'publicReach', label: 'Public Reach', type: 'number' },
  { key: 'assignedArea', label: 'Assigned Area' },
];
