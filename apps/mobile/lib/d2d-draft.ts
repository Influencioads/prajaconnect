import AsyncStorage from '@react-native-async-storage/async-storage';
import { D2DSentiment, D2DPriority } from '@praja/types';

const DRAFT_KEY = 'd2d_survey_draft';

export interface FamilyMemberDraft {
  name: string;
  age?: string;
  gender?: string;
  voterId?: string;
  mobile?: string;
  occupation?: string;
  education?: string;
  votingPreference?: D2DSentiment;
  issues?: string[];
}

export interface D2DSurveyDraft {
  surveyId: string;
  surveyName: string;
  mandalId?: string;
  villageId?: string;
  boothId?: string;
  street?: string;
  houseNumber?: string;
  headName?: string;
  mobile?: string;
  whatsapp?: string;
  address?: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  members: FamilyMemberDraft[];
  answers: Record<string, unknown>;
  sentiment?: D2DSentiment;
  priority?: D2DPriority;
  needsFollowup?: boolean;
  isKeyVoter?: boolean;
  influencer?: boolean;
  issues: string[];
  photos: { uri: string; label?: string }[];
  startedAt?: number;
}

export async function loadDraft(): Promise<D2DSurveyDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  return raw ? (JSON.parse(raw) as D2DSurveyDraft) : null;
}

export async function saveDraft(draft: D2DSurveyDraft) {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function clearDraft() {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export function newDraft(surveyId: string, surveyName: string): D2DSurveyDraft {
  return {
    surveyId,
    surveyName,
    members: [],
    answers: {},
    issues: [],
    photos: [],
    startedAt: Date.now(),
  };
}
