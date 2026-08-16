import api from './api';

export interface OpsSlaItem {
  id: string;
  code: string;
  title: string;
  priority: string;
  status: string;
  slaDueAt: string;
  mandal: string | null;
  assignee: string | null;
  hoursLeft?: number;
  daysOverdue?: number;
  escalationLevel?: number;
}

export interface OpsInactiveCadreItem {
  id: string;
  name: string;
  designation: string;
  mobile: string;
  level: string;
  mandal: string | null;
  booth: string | null;
  parentName: string | null;
}

export interface OpsDarkVillage {
  id: string;
  name: string;
  mandal: string | null;
}

export interface OpsDarkBooth {
  id: string;
  number: string;
  name: string;
  village: string | null;
}

export async function fetchOpsSla(): Promise<{
  atRisk: OpsSlaItem[];
  breached: OpsSlaItem[];
  counts: { atRisk: number; breached: number };
}> {
  const { data } = await api.get('/ops-alerts/sla');
  return data;
}

export async function fetchOpsInactiveCadre(): Promise<{
  days: number;
  count: number;
  data: OpsInactiveCadreItem[];
}> {
  const { data } = await api.get('/ops-alerts/inactive-cadre');
  return data;
}

export async function fetchOpsDarkZones(): Promise<{
  days: number;
  villages: OpsDarkVillage[];
  booths: OpsDarkBooth[];
  counts: { villages: number; booths: number };
}> {
  const { data } = await api.get('/ops-alerts/dark-zones');
  return data;
}

export async function fetchOpsSnapshotLatest() {
  const { data } = await api.get('/ops-alerts/snapshot/latest');
  return data;
}
