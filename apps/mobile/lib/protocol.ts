import { api } from './api';

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const INVITATION_CATEGORIES = ['Wedding', 'Function', 'Opening', 'Festival', 'Other'] as const;
export type InvitationDecision = 'Pending' | 'Attend' | 'SendRepresentative' | 'SendWishes' | 'Decline';

export interface Invitation {
  id: string;
  eventName: string;
  host: string;
  citizen?: { id: string; name: string; mobile?: string | null } | null;
  eventDate: string;
  venue?: string | null;
  cardPhotoUrl?: string | null;
  category: string;
  decision: string;
  representative?: { id: string; name: string; designation?: string | null } | null;
  giftNotes?: string | null;
  wishSent: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface PaginatedInvitations {
  data: Invitation[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function fetchInvitations(filters: Record<string, unknown> = {}) {
  const { data } = await api.get<PaginatedInvitations>('/leader-office/invitations', {
    params: clean(filters),
  });
  return data;
}

export async function decideInvitation(
  id: string,
  body: { decision: InvitationDecision; cadreId?: string; giftNotes?: string; notes?: string },
) {
  const { data } = await api.post(`/leader-office/invitations/${id}/decision`, body);
  return data as { invitation: Invitation; outcome: Record<string, unknown> };
}

export async function createInvitation(body: {
  eventName: string;
  host: string;
  eventDate: string;
  venue?: string;
  category?: string;
  cardPhotoUrl?: string;
  giftNotes?: string;
  notes?: string;
}) {
  const { data } = await api.post<Invitation>('/leader-office/invitations', body);
  return data;
}

/** Uploads a captured invitation-card photo and returns its public URL. */
export async function uploadInvitationCard(uri: string, name = 'invitation-card.jpg') {
  const fd = new FormData();
  fd.append('file', { uri, name, type: 'image/jpeg' } as unknown as Blob);
  const { data } = await api.post('/uploads/protocol', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { url: string };
}
