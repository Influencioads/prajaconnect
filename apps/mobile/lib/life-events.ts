import { api } from './api';

export interface GreetingQueueItem {
  id: string;
  date: string;
  occasion: string;
  targetType: string;
  targetId: string;
  targetName: string;
  mobile?: string | null;
  message: string;
  messageTe?: string | null;
  status: string;
  createdAt: string;
}

export interface LifeEventsToday {
  date: string;
  items: GreetingQueueItem[];
  counts: { pending: number; approved: number; sent: number; skipped: number };
}

export async function fetchLifeEventsToday(): Promise<LifeEventsToday> {
  const { data } = await api.get('/life-events/today');
  return data;
}

/** One-tap approve + send: the send endpoint dispatches regardless of Pending/Approved. */
export async function sendGreeting(id: string): Promise<GreetingQueueItem> {
  const { data } = await api.post(`/life-events/queue/${id}/send`);
  return data;
}

export async function skipGreeting(id: string): Promise<GreetingQueueItem> {
  const { data } = await api.patch(`/life-events/queue/${id}/skip`);
  return data;
}
