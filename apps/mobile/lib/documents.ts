import { api } from './api';
import type { Paginated } from './crm';

function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface DocumentFolder {
  id: string;
  name: string;
  permissionLevel: string;
  category?: { id: string; name: string } | null;
  _count?: { files: number; children?: number };
}

export interface DocumentFile {
  id: string;
  name: string;
  fileUrl: string;
  mimeType?: string | null;
  tags?: string | null;
  folder?: { id: string; name: string };
}

export async function fetchDocumentsDashboard() {
  const { data } = await api.get('/documents/dashboard');
  return data;
}

export async function fetchFolderTree() {
  const { data } = await api.get('/documents/folders/tree');
  return data as DocumentFolder[];
}

export async function fetchDocumentFiles(filters: Record<string, unknown> = {}): Promise<Paginated<DocumentFile>> {
  const { data } = await api.get('/documents/files', { params: clean({ ...filters, limit: 20 }) });
  return data;
}

export async function fetchDocumentFolders(parentId?: string) {
  const { data } = await api.get('/documents/folders', { params: clean({ parentId }) });
  return data as DocumentFolder[];
}

export async function uploadDocumentFile(uri: string, folderId: string, name = 'document.jpg', mimeType = 'image/jpeg', tags?: string) {
  const fd = new FormData();
  fd.append('file', { uri, name, type: mimeType } as unknown as Blob);
  fd.append('folderId', folderId);
  if (tags) fd.append('tags', tags);
  const { data } = await api.post('/documents/files/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
