import api from './api';

export async function fetchModuleDashboard(path: string) {
  const { data } = await api.get(`/${path}/dashboard`);
  return data;
}

export async function fetchModuleList(path: string, resource: string, params?: Record<string, unknown>) {
  const { data } = await api.get(`/${path}/${resource}`, { params });
  return data;
}

export async function postModule(path: string, resource: string, body: Record<string, unknown>) {
  const { data } = await api.post(`/${path}/${resource}`, body);
  return data;
}
