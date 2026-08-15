import { api } from './api';
import type { Paginated } from './crm';

export interface ProjectPick {
  id: string;
  name: string;
  status: string;
  progressPct: number;
  mandal?: { id: string; name: string } | null;
}

export async function fetchProjectsForUpdate(search?: string): Promise<ProjectPick[]> {
  const { data } = await api.get('/projects', {
    params: { limit: 20, ...(search ? { search } : {}) },
  });
  return (data as Paginated<ProjectPick>).data;
}

export interface WorkProgressInput {
  milestone: string;
  percentComplete: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
  photo?: { uri: string; name?: string; type?: string } | null;
}

/** Multipart POST /projects/:id/progress — photo file + GPS + milestone fields. */
export async function submitWorkProgress(projectId: string, input: WorkProgressInput) {
  const fd = new FormData();
  fd.append('milestone', input.milestone);
  fd.append('percentComplete', String(input.percentComplete));
  if (input.latitude != null) fd.append('latitude', String(input.latitude));
  if (input.longitude != null) fd.append('longitude', String(input.longitude));
  if (input.notes) fd.append('notes', input.notes);
  if (input.photo) {
    fd.append('file', {
      uri: input.photo.uri,
      name: input.photo.name ?? 'progress.jpg',
      type: input.photo.type ?? 'image/jpeg',
    } as unknown as Blob);
  }
  const { data } = await api.post(`/projects/${projectId}/progress`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
