import { api } from './api';

// ===== Admin geo management tree (nested with dependent counts) =====
export interface GeoBoothNode {
  id: string;
  number: string;
  name?: string | null;
  voterCount: number;
  villageId: string;
  _count: { citizens: number };
}
export interface GeoVillageNode {
  id: string;
  name: string;
  pincode?: string | null;
  mandalId: string;
  booths: GeoBoothNode[];
  _count: { booths: number; citizens: number };
}
export interface GeoMandalNode {
  id: string;
  name: string;
  constituencyId: string;
  villages: GeoVillageNode[];
  _count: { villages: number; citizens: number; users: number };
}
export interface GeoConstituencyNode {
  id: string;
  name: string;
  number?: number | null;
  type: string;
  districtId: string;
  mandals: GeoMandalNode[];
  _count: { mandals: number; users: number; citizens: number; cadres: number };
}
export interface GeoDistrictNode {
  id: string;
  name: string;
  code: string;
  stateId: string;
  constituencies: GeoConstituencyNode[];
  _count: { constituencies: number };
}
export interface GeoStateNode {
  id: string;
  name: string;
  code: string;
  districts: GeoDistrictNode[];
  _count: { districts: number };
}

export type GeoLevel = 'state' | 'district' | 'constituency' | 'mandal' | 'village' | 'booth';

const PATHS: Record<GeoLevel, string> = {
  state: 'states',
  district: 'districts',
  constituency: 'constituencies',
  mandal: 'mandals',
  village: 'villages',
  booth: 'booths',
};

export async function fetchGeoTree(): Promise<GeoStateNode[]> {
  const { data } = await api.get('/geo/tree');
  return data as GeoStateNode[];
}

export async function createGeoNode(level: GeoLevel, payload: Record<string, unknown>) {
  const { data } = await api.post(`/geo/${PATHS[level]}`, payload);
  return data;
}

export async function updateGeoNode(level: GeoLevel, id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/geo/${PATHS[level]}/${id}`, payload);
  return data;
}

export async function deleteGeoNode(level: GeoLevel, id: string) {
  const { data } = await api.delete(`/geo/${PATHS[level]}/${id}`);
  return data;
}
