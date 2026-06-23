import { api } from './api';

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export async function fetchDocumentsDashboard() {
  const { data } = await api.get('/documents/dashboard');
  return data;
}

export async function fetchDocumentCategories() {
  const { data } = await api.get('/documents/categories');
  return data;
}

export async function createDocumentCategory(body: { name: string }) {
  const { data } = await api.post('/documents/categories', body);
  return data;
}

export async function updateDocumentCategory(id: string, body: { name: string }) {
  const { data } = await api.patch(`/documents/categories/${id}`, body);
  return data;
}

export async function deleteDocumentCategory(id: string) {
  const { data } = await api.delete(`/documents/categories/${id}`);
  return data;
}

export async function fetchFolderTree() {
  const { data } = await api.get('/documents/folders/tree');
  return data;
}

export async function fetchDocumentFolders(parentId?: string) {
  const { data } = await api.get('/documents/folders', { params: cleanParams({ parentId }) });
  return data;
}

export async function createDocumentFolder(body: Record<string, unknown>) {
  const { data } = await api.post('/documents/folders', body);
  return data;
}

export async function updateDocumentFolder(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/documents/folders/${id}`, body);
  return data;
}

export async function deleteDocumentFolder(id: string) {
  const { data } = await api.delete(`/documents/folders/${id}`);
  return data;
}

export async function fetchDocumentFiles(params: Record<string, unknown> = {}) {
  const { data } = await api.get('/documents/files', { params: cleanParams(params) });
  return data;
}

export async function fetchDocumentFile(id: string) {
  const { data } = await api.get(`/documents/files/${id}`);
  return data;
}

export async function uploadDocumentFile(folderId: string, file: File, tags?: string) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folderId', folderId);
  if (tags) fd.append('tags', tags);
  const { data } = await api.post('/documents/files/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateDocumentFile(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/documents/files/${id}`, body);
  return data;
}

export async function deleteDocumentFile(id: string) {
  const { data } = await api.delete(`/documents/files/${id}`);
  return data;
}

export async function viewDocumentFile(id: string) {
  const { data } = await api.get(`/documents/files/${id}/view`);
  return data;
}

export async function downloadDocumentFile(id: string) {
  const { data } = await api.get(`/documents/files/${id}/download`);
  return data;
}

export async function downloadDocumentsReport(type: string) {
  const response = await api.get(`/documents/reports/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `documents-${type}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
