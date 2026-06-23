import { api } from './api';
import {
  AssetCategory,
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_SLUGS,
} from '@praja/types';
import type { Paginated } from './crm';

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface AssetListItem {
  id: string;
  category: string;
  name: string;
  code: string;
  status: string;
  condition?: string | null;
  contractor?: string | null;
  address?: string | null;
  wardNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mandal?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
  attributes?: Record<string, unknown> | null;
  road?: Record<string, unknown> | null;
  hospital?: Record<string, unknown> | null;
  school?: Record<string, unknown> | null;
  rws?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AssetLogItem {
  id: string;
  type: string;
  note?: string | null;
  status?: string | null;
  performedBy?: string | null;
  performedAt: string;
}

export interface AssetDetail extends AssetListItem {
  description?: string | null;
  department?: { id: string; name: string } | null;
  logs: AssetLogItem[];
  photos: { id: string; url: string; label?: string | null }[];
  documents: { id: string; url: string; label?: string | null }[];
  grievances: { id: string; code: string; title: string; status: string }[];
}

export interface AssetStats {
  category?: string;
  total: number;
  byStatus?: Record<string, number>;
  byCategory?: Record<string, number>;
  underMaintenance?: number;
  underDevelopment?: number;
  detail?: Record<string, unknown>;
}

export async function fetchAssets(filters: {
  page?: number;
  search?: string;
  category?: string;
  status?: string;
  mandalId?: string;
}): Promise<Paginated<AssetListItem>> {
  const { data } = await api.get('/assets', { params: clean({ ...filters, limit: 20 }) });
  return data;
}
export async function fetchAsset(id: string): Promise<AssetDetail> {
  const { data } = await api.get(`/assets/${id}`);
  return data;
}
export async function fetchAssetStats(category?: string): Promise<AssetStats> {
  const { data } = await api.get('/assets/stats', { params: clean({ category }) });
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

// ---- Lightweight per-category config for mobile forms/lists ----
export type FieldType = 'text' | 'number' | 'select' | 'boolean';
export interface MobileAssetField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  store: 'detail' | 'attribute';
  detailKey?: 'road' | 'hospital' | 'school' | 'rws';
}
export interface MobileAssetConfig {
  category: AssetCategory;
  slug: string;
  label: string;
  singular: string;
  showCondition?: boolean;
  fields: MobileAssetField[];
  primaryInfo?: (item: AssetListItem) => string;
}

const a = (item: AssetListItem, key: string): string => {
  const v = (item.attributes ?? {})[key];
  return v == null || v === '' ? '—' : String(v);
};
const d = (item: AssetListItem, dk: 'road' | 'hospital' | 'school' | 'rws', key: string): string => {
  const v = (item[dk] ?? {})?.[key as keyof object] as unknown;
  return v == null || v === '' ? '—' : String(v);
};

export const MOBILE_ASSET_CONFIGS: Record<string, MobileAssetConfig> = {
  [ASSET_CATEGORY_SLUGS[AssetCategory.Roads]]: {
    category: AssetCategory.Roads,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Roads],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Roads],
    singular: 'Road',
    showCondition: true,
    fields: [
      { key: 'roadType', label: 'Road Type', type: 'text', store: 'detail', detailKey: 'road' },
      { key: 'lengthKm', label: 'Length (km)', type: 'number', store: 'detail', detailKey: 'road' },
      { key: 'widthM', label: 'Width (m)', type: 'number', store: 'detail', detailKey: 'road' },
    ],
    primaryInfo: (i) => `${d(i, 'road', 'roadType')} · ${d(i, 'road', 'lengthKm')} km`,
  },
  [ASSET_CATEGORY_SLUGS[AssetCategory.Hospitals]]: {
    category: AssetCategory.Hospitals,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Hospitals],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Hospitals],
    singular: 'Hospital',
    fields: [
      { key: 'hospitalType', label: 'Type', type: 'select', options: ['Government', 'PHC', 'CHC', 'Private'], store: 'detail', detailKey: 'hospital' },
      { key: 'doctorsCount', label: 'Doctors', type: 'number', store: 'detail', detailKey: 'hospital' },
      { key: 'bedsCount', label: 'Beds', type: 'number', store: 'detail', detailKey: 'hospital' },
      { key: 'ambulances', label: 'Ambulances', type: 'number', store: 'detail', detailKey: 'hospital' },
    ],
    primaryInfo: (i) => `${d(i, 'hospital', 'hospitalType')} · ${d(i, 'hospital', 'bedsCount')} beds`,
  },
  [ASSET_CATEGORY_SLUGS[AssetCategory.Schools]]: {
    category: AssetCategory.Schools,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.Schools],
    label: ASSET_CATEGORY_LABELS[AssetCategory.Schools],
    singular: 'School',
    fields: [
      { key: 'schoolType', label: 'Type', type: 'select', options: ['Government', 'Private', 'Aided', 'Model'], store: 'detail', detailKey: 'school' },
      { key: 'studentCount', label: 'Students', type: 'number', store: 'detail', detailKey: 'school' },
      { key: 'teacherCount', label: 'Teachers', type: 'number', store: 'detail', detailKey: 'school' },
    ],
    primaryInfo: (i) => `${d(i, 'school', 'schoolType')} · ${d(i, 'school', 'studentCount')} students`,
  },
  [ASSET_CATEGORY_SLUGS[AssetCategory.RwsAssets]]: {
    category: AssetCategory.RwsAssets,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.RwsAssets],
    label: ASSET_CATEGORY_LABELS[AssetCategory.RwsAssets],
    singular: 'Water Supply Asset',
    fields: [
      { key: 'assetType', label: 'Asset Type', type: 'select', options: ['Borewell', 'Pipeline', 'OHSR', 'WaterPlant', 'HandPump'], store: 'detail', detailKey: 'rws' },
      { key: 'functional', label: 'Functional', type: 'boolean', store: 'detail', detailKey: 'rws' },
      { key: 'distributionStatus', label: 'Distribution Status', type: 'text', store: 'detail', detailKey: 'rws' },
    ],
    primaryInfo: (i) => `${d(i, 'rws', 'assetType')}`,
  },
  [ASSET_CATEGORY_SLUGS[AssetCategory.DevelopmentWorks]]: {
    category: AssetCategory.DevelopmentWorks,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.DevelopmentWorks],
    label: ASSET_CATEGORY_LABELS[AssetCategory.DevelopmentWorks],
    singular: 'Work',
    fields: [
      { key: 'workType', label: 'Work Type', type: 'text', store: 'attribute' },
      { key: 'budget', label: 'Budget (₹)', type: 'number', store: 'attribute' },
      { key: 'progressPct', label: 'Progress (%)', type: 'number', store: 'attribute' },
    ],
    primaryInfo: (i) => `${a(i, 'workType')} · ${a(i, 'progressPct')}%`,
  },
  [ASSET_CATEGORY_SLUGS[AssetCategory.GovernmentOffices]]: {
    category: AssetCategory.GovernmentOffices,
    slug: ASSET_CATEGORY_SLUGS[AssetCategory.GovernmentOffices],
    label: ASSET_CATEGORY_LABELS[AssetCategory.GovernmentOffices],
    singular: 'Office',
    fields: [
      { key: 'department', label: 'Department', type: 'text', store: 'attribute' },
      { key: 'officer', label: 'Officer', type: 'text', store: 'attribute' },
      { key: 'contact', label: 'Contact', type: 'text', store: 'attribute' },
    ],
    primaryInfo: (i) => `${a(i, 'department')}`,
  },
};

/** Generic fallback config for categories without a tailored mobile config. */
export function configForSlug(slug: string): MobileAssetConfig {
  const found = MOBILE_ASSET_CONFIGS[slug];
  if (found) return found;
  const entry = (Object.keys(ASSET_CATEGORY_SLUGS) as AssetCategory[]).find(
    (c) => ASSET_CATEGORY_SLUGS[c] === slug,
  );
  const category = entry ?? AssetCategory.Roads;
  return {
    category,
    slug,
    label: ASSET_CATEGORY_LABELS[category],
    singular: 'Asset',
    fields: [],
  };
}

export const MOBILE_ASSET_LIST: MobileAssetConfig[] = (
  Object.keys(ASSET_CATEGORY_SLUGS) as AssetCategory[]
).map((c) => configForSlug(ASSET_CATEGORY_SLUGS[c]));
