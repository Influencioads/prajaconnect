import { api } from './api';
import type { Paginated } from './compliance';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const INVITATION_CATEGORIES = ['Wedding', 'Function', 'Opening', 'Festival', 'Other'] as const;
export const INVITATION_DECISIONS = ['Pending', 'Attend', 'SendRepresentative', 'SendWishes', 'Decline'] as const;

export type InvitationCategory = (typeof INVITATION_CATEGORIES)[number];
export type InvitationDecision = (typeof INVITATION_DECISIONS)[number];

export interface Invitation {
  id: string;
  eventName: string;
  host: string;
  citizenId?: string | null;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
  eventDate: string;
  venue?: string | null;
  cardPhotoUrl?: string | null;
  category: string;
  decision: string;
  representativeId?: string | null;
  representative?: { id: string; name: string; mobile?: string | null; designation?: string | null } | null;
  giftNotes?: string | null;
  wishSent: boolean;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationCalendar {
  month: string;
  from: string;
  to: string;
  total: number;
  days: { date: string; items: Invitation[] }[];
}

export async function fetchInvitations(
  filters: Record<string, unknown> = {},
): Promise<Paginated<Invitation>> {
  const { data } = await api.get('/leader-office/invitations', { params: clean(filters) });
  return data;
}

export async function fetchInvitationCalendar(month?: string): Promise<InvitationCalendar> {
  const { data } = await api.get('/leader-office/invitations/calendar', { params: clean({ month }) });
  return data;
}

export async function createInvitation(body: {
  eventName: string;
  host: string;
  citizenId?: string;
  eventDate: string;
  venue?: string;
  cardPhotoUrl?: string;
  category?: string;
  giftNotes?: string;
  notes?: string;
}): Promise<Invitation> {
  const { data } = await api.post('/leader-office/invitations', body);
  return data;
}

export async function updateInvitation(
  id: string,
  body: Partial<{
    eventName: string;
    host: string;
    citizenId: string;
    eventDate: string;
    venue: string;
    cardPhotoUrl: string;
    category: string;
    giftNotes: string;
    notes: string;
  }>,
): Promise<Invitation> {
  const { data } = await api.patch(`/leader-office/invitations/${id}`, body);
  return data;
}

export async function deleteInvitation(id: string) {
  const { data } = await api.delete(`/leader-office/invitations/${id}`);
  return data;
}

export async function decideInvitation(
  id: string,
  body: { decision: InvitationDecision; cadreId?: string; giftNotes?: string; notes?: string },
): Promise<{ invitation: Invitation; outcome: Record<string, unknown> }> {
  const { data } = await api.post(`/leader-office/invitations/${id}/decision`, body);
  return data;
}

export async function uploadInvitationCard(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/uploads/protocol', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
