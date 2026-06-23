import { D2DSentiment, D2DPriority } from '@praja/types';
import { api } from './api';

export interface D2DAssignment {
  id: string;
  survey: {
    id: string;
    name: string;
    nameTe?: string | null;
    type: string;
    questions?: {
      id: string;
      order: number;
      type: string;
      label: string;
      labelTe?: string | null;
      required: boolean;
      options?: { label: string; labelTe?: string | null; value: string }[];
    }[];
    targetMandal?: { name: string } | null;
    targetVillage?: { name: string } | null;
    targetBooth?: { number: string } | null;
  };
  dailyTarget: number;
  mandalId?: string | null;
  villageId?: string | null;
  boothId?: string | null;
  street?: string | null;
}

export async function fetchMyD2DAssignments() {
  const { data } = await api.get('/d2d-surveys/my-assignments');
  return data as {
    assignments: D2DAssignment[];
    targets: { target: number; completed: number }[];
    completedToday: number;
  };
}

export async function submitD2DResponse(body: {
  surveyId: string;
  clientId?: string;
  household?: Record<string, unknown>;
  householdId?: string;
  sentiment?: D2DSentiment;
  priority?: D2DPriority;
  needsFollowup?: boolean;
  isKeyVoter?: boolean;
  influencer?: boolean;
  issues?: string[];
  timeTakenSec?: number;
  latitude?: number;
  longitude?: number;
  answers?: { questionId: string; value: unknown }[];
  photos?: { url: string; label?: string }[];
}) {
  const { data } = await api.post('/d2d-responses', body);
  return data;
}

export async function syncD2DBatch(body: {
  deviceId: string;
  households?: Record<string, unknown>[];
  responses?: Record<string, unknown>[];
}) {
  const { data } = await api.post('/d2d-sync', body);
  return data;
}

export async function fetchD2DPendingSync(deviceId: string) {
  const { data } = await api.get('/d2d-sync/pending', { params: { deviceId } });
  return data as number;
}
