import { api } from './api';

export async function checkCitizenDuplicate(mobile?: string, name?: string) {
  const params: Record<string, string> = {};
  if (mobile) params.mobile = mobile;
  if (name) params.name = name;
  const { data } = await api.get('/data-quality/check-citizen-duplicate', { params });
  return data as {
    hasDuplicate: boolean;
    readOnly?: boolean;
    warnings: { citizenId: string; name: string; mobile?: string | null; score: number; reason: string }[];
  };
}
