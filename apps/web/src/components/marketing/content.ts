import {
  Shield,
  LayoutDashboard,
  Network,
  FileWarning,
  Landmark,
  CalendarCheck,
  DoorOpen,
  Sparkles,
  BarChart3,
  Smartphone,
  Users,
  Vote,
  MessageCircle,
  MapPin,
  Building2,
  type LucideIcon,
} from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** High-level capabilities — sourced from README "Features". */
export const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: 'Auth & RBAC',
    description:
      'JWT access/refresh tokens, 9 roles and module-level view / edit / full access control across every screen.',
  },
  {
    icon: LayoutDashboard,
    title: 'Executive dashboard',
    description:
      'Live KPIs, mandal and grievance charts, and a recent-activity feed — the whole constituency at a glance.',
  },
  {
    icon: Network,
    title: 'Cadre & citizen CRM',
    description:
      'Booth-mapped cadre hierarchy plus a citizen master with family, voter and household data.',
  },
  {
    icon: FileWarning,
    title: 'Grievances & SLA',
    description:
      'Status workflow with department routing, SLA timers, geo-tagging, escalation and citizen feedback.',
  },
  {
    icon: Landmark,
    title: 'Service delivery',
    description:
      'Officials directory, escalation matrix, schemes, beneficiaries and an eligibility checker.',
  },
  {
    icon: CalendarCheck,
    title: 'Engagement',
    description:
      'WhatsApp inbox, events with QR check-in, surveys, a Leaflet GIS map and development projects.',
  },
  {
    icon: DoorOpen,
    title: 'Door-to-door surveys',
    description:
      'Offline-first D2D campaigns with a sync queue, household mapping and volunteer targets.',
  },
  {
    icon: Sparkles,
    title: 'AI Command Center',
    description:
      'Health, readiness, sentiment and risk alerts with a daily briefing — computed over live data.',
  },
  {
    icon: BarChart3,
    title: 'Reports & export',
    description:
      'Cross-module analytics with one-click CSV export for offline review and audits.',
  },
  {
    icon: Smartphone,
    title: 'Mobile app',
    description:
      'An Expo app for cadre in the field — login, directory, grievances, eligibility and events.',
  },
];

export interface ModuleHighlight {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}

/** Deeper module spotlights for the home + features pages. */
export const MODULES: ModuleHighlight[] = [
  {
    icon: Network,
    eyebrow: 'Organisation',
    title: 'Cadre hierarchy, mapped to every booth',
    description:
      'Model the party from State down to the polling booth and place each karyakarta exactly where they work.',
    points: [
      'Six-tier geography: State → District → Constituency → Mandal → Village → Booth',
      'Designations, contact details and active / inactive status',
      'Booth-level coverage so no part of the constituency is blind',
    ],
  },
  {
    icon: Users,
    eyebrow: 'People',
    title: 'A citizen master that actually knows the family',
    description:
      'Maintain citizens with family linkage and voter data so outreach is personal, not a spreadsheet blast.',
    points: [
      'Family and household grouping',
      'Voter and demographic fields',
      'Searchable, filterable and CSV-importable',
    ],
  },
  {
    icon: FileWarning,
    eyebrow: 'Service',
    title: 'Grievances with a real workflow and SLA clock',
    description:
      'Log, route, escalate and resolve — with a department SLA timer running and a full audit trail on every update.',
    points: [
      'Auto-routing to departments and officials',
      'SLA due dates with overdue tracking',
      'Status history, geo-tagging and citizen satisfaction feedback',
    ],
  },
  {
    icon: DoorOpen,
    eyebrow: 'Field',
    title: 'Door-to-door survey engine, offline-first',
    description:
      'Run structured field campaigns even with no signal — responses queue on device and sync when back online.',
    points: [
      'Custom questions, options and sentiment capture',
      'Household and family-member mapping with photos & geo',
      'Volunteer targets, follow-ups and a resilient sync queue',
    ],
  },
  {
    icon: Sparkles,
    eyebrow: 'Intelligence',
    title: 'AI Command Center over live data',
    description:
      'Rule-based scoring turns activity across the platform into readiness, sentiment and risk signals you can act on.',
    points: [
      'Organisation health & election-readiness scores',
      'Sentiment and risk alerts',
      'A daily briefing that summarises what changed',
    ],
  },
  {
    icon: MapPin,
    eyebrow: 'Geography',
    title: 'GIS, events and engagement in one place',
    description:
      'See the constituency on a map, run events with QR check-in and keep every WhatsApp conversation in context.',
    points: [
      'Leaflet GIS map of cadre, grievances and projects',
      'Events with QR-code check-in and attendee tracking',
      'WhatsApp inbox, surveys and development projects',
    ],
  },
];

export interface RoleTier {
  rank: number;
  role: string;
  scope: string;
}

/** The 9-role ladder — from README demo accounts. */
export const ROLES: RoleTier[] = [
  { rank: 1, role: 'Super Admin', scope: 'Full platform control & configuration' },
  { rank: 2, role: 'State Leader', scope: 'Statewide visibility across all districts' },
  { rank: 3, role: 'District Leader', scope: 'A district and its constituencies' },
  { rank: 4, role: 'Constituency Incharge', scope: 'One constituency, end to end' },
  { rank: 5, role: 'Mandal Coordinator', scope: 'A mandal and its villages' },
  { rank: 6, role: 'Booth Coordinator', scope: 'A polling booth and its voters' },
  { rank: 7, role: 'Volunteer', scope: 'Field tasks, surveys and outreach' },
  { rank: 8, role: 'Government Official', scope: 'Assigned grievances & service delivery' },
  { rank: 9, role: 'Citizen', scope: 'Raise grievances & track resolution' },
];

export interface StatItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const STATS: StatItem[] = [
  { value: '175', label: 'Assembly constituencies', icon: Vote },
  { value: '6-tier', label: 'Geography, State to Booth', icon: Building2 },
  { value: '9', label: 'Role levels with RBAC', icon: Shield },
  { value: '24/7', label: 'Citizen grievance intake', icon: MessageCircle },
];
