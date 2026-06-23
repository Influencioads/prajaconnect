import {
  D2DPriority,
  D2DQuestionType,
  D2DSentiment,
  D2DSurveyStatus,
  D2DSurveyType,
} from '@praja/types';
import { api, API_URL } from './api';

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  data: T[];
  meta: ApiMeta;
}

function cleanParams(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export interface D2DSurveyListItem {
  id: string;
  name: string;
  nameTe?: string | null;
  type: D2DSurveyType;
  status: D2DSurveyStatus;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  targetHouseholds: number;
  progressPct?: number;
  completedHouseholds?: number;
  pendingHouseholds?: number;
  targetMandal?: { id: string; name: string } | null;
  targetVillage?: { id: string; name: string } | null;
  targetBooth?: { id: string; number: string; name?: string | null } | null;
  _count?: { responses: number; assignments: number; questions: number };
}

export interface D2DQuestionOption {
  id: string;
  order: number;
  label: string;
  labelTe?: string | null;
  value: string;
}

export interface D2DQuestion {
  id: string;
  order: number;
  type: D2DQuestionType;
  label: string;
  labelTe?: string | null;
  required: boolean;
  config?: Record<string, unknown> | null;
  options?: D2DQuestionOption[];
}

export interface D2DSurveyDetail extends D2DSurveyListItem {
  questions: D2DQuestion[];
  assignments?: {
    id: string;
    user?: { id: string; name: string } | null;
    cadre?: { id: string; name: string } | null;
    dailyTarget: number;
    street?: string | null;
  }[];
}

export interface D2DDashboardStats {
  totalSurveys: number;
  activeSurveys: number;
  completedSurveys: number;
  assignedVolunteers: number;
  totalHousesCovered: number;
  totalVotersSurveyed: number;
  pendingHouses: number;
  sentimentScore: number;
  supporter: number;
  neutral: number;
  opponent: number;
  grievancesFromSurvey: number;
  topIssues: { issue: string; count: number }[];
  boothProgress: { boothId: string | null; covered: number }[];
  mandalProgress: { mandalId: string | null; covered: number }[];
}

export interface D2DResponseItem {
  id: string;
  surveyId: string;
  sentiment?: D2DSentiment | null;
  priority?: D2DPriority | null;
  submittedAt: string;
  timeTakenSec?: number | null;
  survey?: { id: string; name: string; type: string };
  household?: {
    id: string;
    headName: string;
    houseNumber?: string | null;
    mobile?: string | null;
    village?: { name: string } | null;
    booth?: { number: string } | null;
    members?: { name: string; voterId?: string | null }[];
  } | null;
  surveyorUser?: { id: string; name: string } | null;
  _count?: { photos: number; answers: number };
}

export interface D2DAnalytics {
  sentiment: Record<string, number>;
  supporterPct: number;
  neutralPct: number;
  opponentPct: number;
  topComplaints: { issue: string; count: number }[];
  leaderPopularityScore: number;
  candidateFeedbackScore: number;
  totalResponses: number;
  demographicFeedback: {
    women: Record<string, number>;
    youth: Record<string, number>;
    seniors: Record<string, number>;
  };
  schemeGaps: Record<string, number>;
}

export async function fetchD2DStats(): Promise<D2DDashboardStats> {
  const { data } = await api.get('/d2d-surveys/stats');
  return data;
}

export async function fetchD2DSurveys(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: D2DSurveyStatus;
  type?: D2DSurveyType;
  mandalId?: string;
}): Promise<Paginated<D2DSurveyListItem>> {
  const { data } = await api.get('/d2d-surveys', { params: cleanParams(filters) });
  return data;
}

export async function fetchD2DSurvey(id: string): Promise<D2DSurveyDetail> {
  const { data } = await api.get(`/d2d-surveys/${id}`);
  return data;
}

export async function createD2DSurvey(body: {
  name: string;
  nameTe?: string;
  type: D2DSurveyType;
  description?: string;
  startDate?: string;
  endDate?: string;
  targetMandalId?: string;
  targetVillageId?: string;
  targetBoothId?: string;
  targetHouseholds?: number;
}) {
  const { data } = await api.post('/d2d-surveys', body);
  return data;
}

export async function updateD2DSurvey(id: string, body: Partial<Parameters<typeof createD2DSurvey>[0] & { status: D2DSurveyStatus }>) {
  const { data } = await api.put(`/d2d-surveys/${id}`, body);
  return data;
}

export async function deleteD2DSurvey(id: string) {
  const { data } = await api.delete(`/d2d-surveys/${id}`);
  return data;
}

export async function saveD2DQuestions(
  id: string,
  questions: {
    order: number;
    type: D2DQuestionType;
    label: string;
    labelTe?: string;
    required?: boolean;
    config?: Record<string, unknown>;
    options?: { order: number; label: string; labelTe?: string; value: string }[];
  }[],
) {
  const { data } = await api.post(`/d2d-surveys/${id}/questions`, { questions });
  return data;
}

export async function assignD2DSurvey(
  id: string,
  body: {
    userId?: string;
    cadreId?: string;
    mandalId?: string;
    villageId?: string;
    boothId?: string;
    street?: string;
    dailyTarget?: number;
  },
) {
  const { data } = await api.post(`/d2d-surveys/${id}/assign`, body);
  return data;
}

export async function updateD2DSurveyStatus(id: string, status: D2DSurveyStatus) {
  const { data } = await api.patch(`/d2d-surveys/${id}/status`, { status });
  return data;
}

export async function fetchD2DAssignments(filters?: {
  page?: number;
  limit?: number;
  surveyId?: string;
  search?: string;
}): Promise<Paginated<unknown> & { leaderboard?: { userId: string; name: string; completed: number }[] }> {
  const { data } = await api.get('/d2d-assignments', { params: cleanParams(filters ?? {}) });
  return data;
}

export async function fetchD2DResponses(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  surveyId?: string;
  mandalId?: string;
  villageId?: string;
  boothId?: string;
  volunteerId?: string;
  sentiment?: D2DSentiment;
}): Promise<Paginated<D2DResponseItem>> {
  const { data } = await api.get('/d2d-responses', { params: cleanParams(filters ?? {}) });
  return data;
}

export async function fetchD2DResponse(id: string) {
  const { data } = await api.get(`/d2d-responses/${id}`);
  return data;
}

export async function fetchD2DHouseholds(filters?: {
  page?: number;
  search?: string;
  mandalId?: string;
  villageId?: string;
  boothId?: string;
}) {
  const { data } = await api.get('/d2d-responses/households', { params: cleanParams(filters ?? {}) });
  return data;
}

export async function convertD2DToGrievance(id: string, body?: { title?: string; description?: string; category?: string }) {
  const { data } = await api.post(`/d2d-responses/${id}/convert-grievance`, body ?? {});
  return data;
}

export async function convertD2DToCitizen(id: string, createFamily = true) {
  const { data } = await api.post(`/d2d-responses/${id}/convert-citizen`, { createFamily });
  return data;
}

export async function createD2DFollowup(id: string, body: { note?: string; dueAt?: string; assignedToUserId?: string }) {
  const { data } = await api.post(`/d2d-responses/${id}/followup`, body);
  return data;
}

export async function fetchD2DAnalytics(filters?: { surveyId?: string; mandalId?: string; villageId?: string; boothId?: string }): Promise<D2DAnalytics> {
  const { data } = await api.get('/d2d-analytics', { params: cleanParams(filters ?? {}) });
  return data;
}

export async function fetchD2DReports() {
  const { data } = await api.get('/d2d-reports');
  return data;
}

export function d2dReportExportUrl(type: string, params?: Record<string, string>) {
  const qs = new URLSearchParams(cleanParams(params ?? {}) as Record<string, string>).toString();
  return `${API_URL}/d2d-reports/export/${type}${qs ? `?${qs}` : ''}`;
}
