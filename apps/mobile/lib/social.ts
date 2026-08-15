import { api } from './api';
import type { Paginated } from './crm';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrl?: string | null;
  scheduledAt?: string | null;
  status: string;
  postedAt?: string | null;
  createdAt: string;
}

export interface RivalMention {
  id: string;
  sentiment: string;
  quote?: string | null;
  createdAt: string;
  rival: { id: string; name: string; party?: string | null };
  article: { id: string; title: string; source?: string | null; url?: string | null };
}

export async function fetchSocialPosts(filters: Record<string, unknown> = {}): Promise<Paginated<SocialPost>> {
  const { data } = await api.get('/social/posts', { params: clean(filters) });
  return data;
}

export async function approveSocialPost(id: string) {
  const { data } = await api.patch(`/social/posts/${id}/approve`);
  return data as SocialPost;
}

export async function rejectSocialPost(id: string) {
  const { data } = await api.patch(`/social/posts/${id}/reject`);
  return data as SocialPost;
}

export async function fetchRivalMentions(filters: Record<string, unknown> = {}): Promise<Paginated<RivalMention>> {
  const { data } = await api.get('/pr-management/rival-mentions', { params: clean(filters) });
  return data;
}
