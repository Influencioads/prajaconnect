import {
  Route,
  Receipt,
  Church,
  Hammer,
  Store,
  Trees,
  Hospital,
  School,
  Users,
  Waves,
  Droplets,
  Leaf,
  Building2,
  Boxes,
  type LucideIcon,
} from 'lucide-react';
import { AssetCategory, ASSET_CATEGORY_LABELS, ASSET_CATEGORY_SLUGS } from '@praja/types';
import type { AssetListItem, AssetStats } from './crm';

export type AssetFieldType = 'text' | 'number' | 'textarea' | 'select' | 'date' | 'boolean';
export type DetailKey = 'road' | 'hospital' | 'school' | 'rws';

export interface AssetField {
  key: string;
  label: string;
  type: AssetFieldType;
  options?: string[];
  /** Where the value is stored: a dedicated detail table or the JSON attributes bag. */
  store: 'detail' | 'attribute';
  detailKey?: DetailKey;
  placeholder?: string;
}

export interface AnalyticCard {
  /** Reads from stats.detail[key] unless `root` is set (then stats[key]). */
  key: string;
  label: string;
  root?: boolean;
  suffix?: string;
}

export interface AssetCategoryConfig {
  category: AssetCategory;
  slug: string;
  label: string;
  singular: string;
  description: string;
  icon: LucideIcon;
  detailKey?: DetailKey;
  showCondition?: boolean;
  fields: AssetField[];
  analytics: AnalyticCard[];
  /** A short, category-specific summary line for list rows. */
  primaryInfo?: (item: AssetListItem) => string;
}

const CONDITION_ANALYTICS: AnalyticCard[] = [];

function attr(item: AssetListItem, key: string): string {
  const v = (item.attributes ?? {})[key];
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

export const ASSET_CONFIGS: Record<AssetCategory, AssetCategoryConfig> = {
  [AssetCategory.Roads]: {
    category: AssetCategory.Roads,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Roads],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Roads],
    singular: 'Road',
    description: 'Road master database with length, condition and repair history.',
    icon: Route,
    detailKey: 'road',
    showCondition: true,
    fields: [
      { key: 'roadType', label: 'Road Type', type: 'select', options: ['CC Road', 'BT Road', 'Gravel', 'Mud', 'Other'], store: 'detail', detailKey: 'road' },
      { key: 'lengthKm', label: 'Length (km)', type: 'number', store: 'detail', detailKey: 'road' },
      { key: 'widthM', label: 'Width (m)', type: 'number', store: 'detail', detailKey: 'road' },
      { key: 'lastRepairDate', label: 'Last Repair Date', type: 'date', store: 'detail', detailKey: 'road' },
    ],
    analytics: [
      { key: 'totalLengthKm', label: 'Total Length', suffix: ' km' },
      { key: 'goodRoads', label: 'Good Roads' },
      { key: 'damagedRoads', label: 'Damaged Roads' },
      { key: 'underDevelopment', label: 'Under Development' },
    ],
    primaryInfo: (i) => `${i.road?.roadType ?? '—'} · ${i.road?.lengthKm ?? 0} km`,
  },
  [AssetCategory.Hospitals]: {
    category: AssetCategory.Hospitals,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Hospitals],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Hospitals],
    singular: 'Hospital',
    description: 'Government hospitals, PHCs and private hospitals with capacity data.',
    icon: Hospital,
    detailKey: 'hospital',
    fields: [
      { key: 'hospitalType', label: 'Type', type: 'select', options: ['Government', 'PHC', 'CHC', 'Private'], store: 'detail', detailKey: 'hospital' },
      { key: 'doctorsCount', label: 'Doctors', type: 'number', store: 'detail', detailKey: 'hospital' },
      { key: 'bedsCount', label: 'Beds', type: 'number', store: 'detail', detailKey: 'hospital' },
      { key: 'ambulances', label: 'Ambulances', type: 'number', store: 'detail', detailKey: 'hospital' },
      { key: 'emergencyContact', label: 'Emergency Contact', type: 'text', store: 'detail', detailKey: 'hospital' },
      { key: 'services', label: 'Services Available', type: 'textarea', store: 'detail', detailKey: 'hospital' },
    ],
    analytics: [
      { key: 'totalBeds', label: 'Total Beds' },
      { key: 'totalDoctors', label: 'Total Doctors' },
      { key: 'totalAmbulances', label: 'Ambulances' },
    ],
    primaryInfo: (i) => `${i.hospital?.hospitalType ?? '—'} · ${i.hospital?.bedsCount ?? 0} beds`,
  },
  [AssetCategory.Schools]: {
    category: AssetCategory.Schools,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Schools],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Schools],
    singular: 'School',
    description: 'Government and private schools with enrolment and staffing.',
    icon: School,
    detailKey: 'school',
    fields: [
      { key: 'schoolType', label: 'Type', type: 'select', options: ['Government', 'Private', 'Aided', 'Model'], store: 'detail', detailKey: 'school' },
      { key: 'studentCount', label: 'Students', type: 'number', store: 'detail', detailKey: 'school' },
      { key: 'teacherCount', label: 'Teachers', type: 'number', store: 'detail', detailKey: 'school' },
      { key: 'performanceScore', label: 'Performance Score', type: 'number', store: 'detail', detailKey: 'school' },
      { key: 'midDayMeal', label: 'Mid-Day Meal', type: 'boolean', store: 'detail', detailKey: 'school' },
    ],
    analytics: [
      { key: 'totalStudents', label: 'Total Students' },
      { key: 'totalTeachers', label: 'Total Teachers' },
      { key: 'studentTeacherRatio', label: 'Student:Teacher', suffix: ':1' },
      { key: 'midDayMealSchools', label: 'Mid-Day Meal' },
    ],
    primaryInfo: (i) => `${i.school?.schoolType ?? '—'} · ${i.school?.studentCount ?? 0} students`,
  },
  [AssetCategory.RwsAssets]: {
    category: AssetCategory.RwsAssets,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.RwsAssets],
    label: ASSET_CATEGORY_LABELS[AssetCategory.RwsAssets],
    singular: 'Water Supply Asset',
    description: 'Rural water supply assets - borewells, pipelines, OHSR tanks and plants.',
    icon: Droplets,
    detailKey: 'rws',
    fields: [
      { key: 'assetType', label: 'Asset Type', type: 'select', options: ['Borewell', 'Pipeline', 'OHSR', 'WaterPlant', 'HandPump'], store: 'detail', detailKey: 'rws' },
      { key: 'functional', label: 'Functional', type: 'boolean', store: 'detail', detailKey: 'rws' },
      { key: 'distributionStatus', label: 'Distribution Status', type: 'select', options: ['Normal', 'Disrupted', 'Partial'], store: 'detail', detailKey: 'rws' },
    ],
    analytics: [
      { key: 'functional', label: 'Functional' },
      { key: 'nonFunctional', label: 'Non-Functional' },
    ],
    primaryInfo: (i) => `${i.rws?.assetType ?? '—'} · ${i.rws?.functional ? 'Functional' : 'Down'}`,
  },

  // ---- Generic-engine categories (JSON attributes) ----
  [AssetCategory.Taxes]: {
    category: AssetCategory.Taxes,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Taxes],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Taxes],
    singular: 'Tax Record',
    description: 'Property, trade and water tax demand and collection tracking.',
    icon: Receipt,
    fields: [
      { key: 'taxType', label: 'Tax Type', type: 'select', options: ['Property', 'Trade License', 'Water', 'Other'], store: 'attribute' },
      { key: 'demand', label: 'Demand (₹)', type: 'number', store: 'attribute' },
      { key: 'collected', label: 'Collected (₹)', type: 'number', store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'taxType')} · ₹${attr(i, 'collected')}/${attr(i, 'demand')}`,
  },
  [AssetCategory.ReligiousPlaces]: {
    category: AssetCategory.ReligiousPlaces,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.ReligiousPlaces],
    label: ASSET_CATEGORY_LABELS[AssetCategory.ReligiousPlaces],
    singular: 'Religious Place',
    description: 'Temples, mosques, churches with trust and committee details.',
    icon: Church,
    fields: [
      { key: 'type', label: 'Type', type: 'select', options: ['Temple', 'Mosque', 'Church', 'Other'], store: 'attribute' },
      { key: 'trust', label: 'Trust / Management', type: 'text', store: 'attribute' },
      { key: 'priestContact', label: 'Priest Contact', type: 'text', store: 'attribute' },
      { key: 'committee', label: 'Committee Members', type: 'textarea', store: 'attribute' },
      { key: 'festivalCalendar', label: 'Festival Calendar', type: 'textarea', store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'type')}`,
  },
  [AssetCategory.DevelopmentWorks]: {
    category: AssetCategory.DevelopmentWorks,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.DevelopmentWorks],
    label: ASSET_CATEGORY_LABELS[AssetCategory.DevelopmentWorks],
    singular: 'Work',
    description: 'Development works registry with budget and progress tracking.',
    icon: Hammer,
    fields: [
      { key: 'workType', label: 'Work Type', type: 'select', options: ['Road', 'Water', 'Drainage', 'School', 'Hospital', 'Electrification', 'Other'], store: 'attribute' },
      { key: 'budget', label: 'Budget (₹)', type: 'number', store: 'attribute' },
      { key: 'spent', label: 'Spent (₹)', type: 'number', store: 'attribute' },
      { key: 'progressPct', label: 'Progress (%)', type: 'number', store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'workType')} · ${attr(i, 'progressPct')}%`,
  },
  [AssetCategory.DealerShops]: {
    category: AssetCategory.DealerShops,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.DealerShops],
    label: ASSET_CATEGORY_LABELS[AssetCategory.DealerShops],
    singular: 'Dealer Shop',
    description: 'Fair price shops with dealer, license and beneficiary coverage.',
    icon: Store,
    fields: [
      { key: 'dealerName', label: 'Dealer Name', type: 'text', store: 'attribute' },
      { key: 'licenseNo', label: 'License No.', type: 'text', store: 'attribute' },
      { key: 'beneficiaries', label: 'Beneficiaries', type: 'number', store: 'attribute' },
      { key: 'stockStatus', label: 'Stock Status', type: 'select', options: ['Available', 'Low', 'Out of Stock'], store: 'attribute' },
      { key: 'complaints', label: 'Complaints', type: 'number', store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'dealerName')} · ${attr(i, 'beneficiaries')} beneficiaries`,
  },
  [AssetCategory.BurialGrounds]: {
    category: AssetCategory.BurialGrounds,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.BurialGrounds],
    label: ASSET_CATEGORY_LABELS[AssetCategory.BurialGrounds],
    singular: 'Burial Ground',
    description: 'Burial grounds with land area, facilities and maintenance status.',
    icon: Trees,
    fields: [
      { key: 'landAreaAcres', label: 'Land Area (acres)', type: 'number', store: 'attribute' },
      { key: 'facilities', label: 'Facilities Available', type: 'textarea', store: 'attribute' },
      { key: 'authority', label: 'Responsible Authority', type: 'text', store: 'attribute' },
      { key: 'maintenanceStatus', label: 'Maintenance Status', type: 'select', options: ['Good', 'Average', 'Poor'], store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'landAreaAcres')} acres`,
  },
  [AssetCategory.DwcraGroups]: {
    category: AssetCategory.DwcraGroups,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.DwcraGroups],
    label: ASSET_CATEGORY_LABELS[AssetCategory.DwcraGroups],
    singular: 'Group',
    description: 'MEPMA / DWCRA self-help groups, members and financial assistance.',
    icon: Users,
    fields: [
      { key: 'groupType', label: 'Group Type', type: 'select', options: ['MEPMA', 'DWCRA', 'SHG', 'Other'], store: 'attribute' },
      { key: 'members', label: 'Members', type: 'number', store: 'attribute' },
      { key: 'activeLoans', label: 'Active Loans', type: 'number', store: 'attribute' },
      { key: 'totalLoanAmount', label: 'Total Loan Amount (₹)', type: 'number', store: 'attribute' },
      { key: 'trainingPrograms', label: 'Training Programs', type: 'textarea', store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'groupType')} · ${attr(i, 'members')} members`,
  },
  [AssetCategory.Tanks]: {
    category: AssetCategory.Tanks,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Tanks],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Tanks],
    singular: 'Tank',
    description: 'Tanks with storage capacity, water level and irrigation coverage.',
    icon: Waves,
    fields: [
      { key: 'capacityMcft', label: 'Capacity (Mcft)', type: 'number', store: 'attribute' },
      { key: 'currentLevelPct', label: 'Current Level (%)', type: 'number', store: 'attribute' },
      { key: 'irrigationCoverage', label: 'Irrigation Coverage', type: 'text', store: 'attribute' },
      { key: 'restorationStatus', label: 'Restoration Status', type: 'select', options: ['Not Required', 'Pending', 'In Progress', 'Completed'], store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'capacityMcft')} Mcft · ${attr(i, 'currentLevelPct')}%`,
  },
  [AssetCategory.GreenAmbassadors]: {
    category: AssetCategory.GreenAmbassadors,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.GreenAmbassadors],
    label: ASSET_CATEGORY_LABELS[AssetCategory.GreenAmbassadors],
    singular: 'Green Ambassador',
    description: 'Volunteer registry, plantation drives and green coverage.',
    icon: Leaf,
    fields: [
      { key: 'volunteers', label: 'Volunteers', type: 'number', store: 'attribute' },
      { key: 'treesPlanted', label: 'Trees Planted', type: 'number', store: 'attribute' },
      { key: 'greenCoveragePct', label: 'Green Coverage (%)', type: 'number', store: 'attribute' },
      { key: 'programs', label: 'Programs / Activities', type: 'textarea', store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'treesPlanted')} trees · ${attr(i, 'volunteers')} volunteers`,
  },
  [AssetCategory.GovernmentOffices]: {
    category: AssetCategory.GovernmentOffices,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.GovernmentOffices],
    label: ASSET_CATEGORY_LABELS[AssetCategory.GovernmentOffices],
    singular: 'Office',
    description: 'Office directory with department, officer and citizen footfall.',
    icon: Building2,
    fields: [
      { key: 'department', label: 'Department', type: 'text', store: 'attribute' },
      { key: 'officer', label: 'Officer In-Charge', type: 'text', store: 'attribute' },
      { key: 'contact', label: 'Contact', type: 'text', store: 'attribute' },
      { key: 'services', label: 'Public Services', type: 'textarea', store: 'attribute' },
      { key: 'footfallPerDay', label: 'Citizen Footfall / Day', type: 'number', store: 'attribute' },
    ],
    analytics: CONDITION_ANALYTICS,
    primaryInfo: (i) => `${attr(i, 'department')} · ${attr(i, 'officer')}`,
  },
};

export const ASSET_CONFIG_LIST: AssetCategoryConfig[] = [
  AssetCategory.Roads,
  AssetCategory.Taxes,
  AssetCategory.ReligiousPlaces,
  AssetCategory.DevelopmentWorks,
  AssetCategory.DealerShops,
  AssetCategory.BurialGrounds,
  AssetCategory.Hospitals,
  AssetCategory.Schools,
  AssetCategory.DwcraGroups,
  AssetCategory.Tanks,
  AssetCategory.RwsAssets,
  AssetCategory.GreenAmbassadors,
  AssetCategory.GovernmentOffices,
].map((c) => ASSET_CONFIGS[c]);

export const OVERVIEW_ICON: LucideIcon = Boxes;

export function configBySlug(slug: string): AssetCategoryConfig | undefined {
  return ASSET_CONFIG_LIST.find((c) => c.slug === slug);
}

export function readAnalytic(stats: AssetStats | undefined, card: AnalyticCard): string {
  if (!stats) return '—';
  const raw = card.root
    ? (stats as unknown as Record<string, unknown>)[card.key]
    : (stats.detail ?? {})[card.key];
  if (raw === undefined || raw === null) return '—';
  return `${typeof raw === 'number' ? raw.toLocaleString('en-IN') : String(raw)}${card.suffix ?? ''}`;
}
