import { api } from './api';
import type { ApiMeta, Paginated } from './media';

function cleanParams(params: Record<string, unknown>) {
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
  approvedBy?: string | null;
  postedAt?: string | null;
  externalUrl?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialMention {
  id: string;
  platform: string;
  author?: string | null;
  content: string;
  url?: string | null;
  sentiment?: string | null;
  severity?: string | null;
  fetchedAt: string;
  source: string;
}

export interface RivalLeader {
  id: string;
  name: string;
  party?: string | null;
  aliases: string[];
  active: boolean;
  createdAt: string;
  _count?: { mentions: number };
}

export interface RivalTimelineWeek {
  weekStart: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
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
  const { data } = await api.get('/social/posts', { params: cleanParams(filters) });
  return data;
}

export async function createSocialPost(body: {
  platform: string;
  content: string;
  mediaUrl?: string;
  scheduledAt?: string;
}) {
  const { data } = await api.post('/social/posts', body);
  return data as SocialPost;
}

export async function updateSocialPost(
  id: string,
  body: { platform?: string; content?: string; mediaUrl?: string; scheduledAt?: string | null },
) {
  const { data } = await api.patch(`/social/posts/${id}`, body);
  return data as SocialPost;
}

export async function deleteSocialPost(id: string) {
  const { data } = await api.delete(`/social/posts/${id}`);
  return data;
}

export async function submitSocialPost(id: string) {
  const { data } = await api.patch(`/social/posts/${id}/submit`);
  return data as SocialPost;
}

export async function approveSocialPost(id: string) {
  const { data } = await api.patch(`/social/posts/${id}/approve`);
  return data as SocialPost;
}

export async function rejectSocialPost(id: string) {
  const { data } = await api.patch(`/social/posts/${id}/reject`);
  return data as SocialPost;
}

export async function draftSocialPost(body: { topic: string; tone?: string }) {
  const { data } = await api.post('/social/posts/draft', body);
  return data as {
    content: string;
    aiGenerated: boolean;
    grounding: { promiseTotal: number; promiseDone: number; projectTotal: number; projectDone: number };
  };
}

export async function runSocialScheduler() {
  const { data } = await api.post('/social/scheduler/run');
  return data as { posted: number };
}

export async function fetchSocialMentions(filters: Record<string, unknown> = {}): Promise<Paginated<SocialMention>> {
  const { data } = await api.get('/social/mentions', { params: cleanParams(filters) });
  return data;
}

export async function fetchRivals(): Promise<RivalLeader[]> {
  const { data } = await api.get('/pr-management/rivals');
  return data;
}

export async function createRival(body: { name: string; party?: string; aliases?: string[]; active?: boolean }) {
  const { data } = await api.post('/pr-management/rivals', body);
  return data as RivalLeader;
}

export async function updateRival(
  id: string,
  body: { name?: string; party?: string; aliases?: string[]; active?: boolean },
) {
  const { data } = await api.patch(`/pr-management/rivals/${id}`, body);
  return data as RivalLeader;
}

export async function deleteRival(id: string) {
  const { data } = await api.delete(`/pr-management/rivals/${id}`);
  return data;
}

export async function fetchRivalTimeline(id: string) {
  const { data } = await api.get(`/pr-management/rivals/${id}/timeline`);
  return data as { rival: RivalLeader; weeks: RivalTimelineWeek[] };
}

export async function fetchRivalMentions(filters: Record<string, unknown> = {}): Promise<Paginated<RivalMention>> {
  const { data } = await api.get('/pr-management/rival-mentions', { params: cleanParams(filters) });
  return data;
}

export type { ApiMeta };
