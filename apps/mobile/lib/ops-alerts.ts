import { api } from './api';

export async function fetchOpsSla() {
  const { data } = await api.get('/ops-alerts/sla');
  return data;
}

export async function fetchOpsInactiveCadre() {
  const { data } = await api.get('/ops-alerts/inactive-cadre');
  return data;
}

export async function fetchOpsDarkZones() {
  const { data } = await api.get('/ops-alerts/dark-zones');
  return data;
}
