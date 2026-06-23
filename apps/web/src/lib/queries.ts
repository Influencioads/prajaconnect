import { api } from './api';

export async function fetchDashboard() {
  const { data } = await api.get('/dashboard');
  return data as DashboardData;
}

export interface DashboardData {
  kpis: {
    citizens: number;
    cadre: number;
    activeCadre: number;
    grievancesTotal: number;
    grievancesOpen: number;
    grievancesResolved: number;
    resolutionRate: number;
    beneficiaries: number;
    whatsappConversations: number;
    events: number;
    projects: number;
    schemes: number;
    slaValidationBreached?: number;
    slaResolutionBreached?: number;
    slaTotalBreached?: number;
  };
  grievanceByStatus: { status: string; count: number }[];
  grievanceByPriority: { priority: string; count: number }[];
  byMandal: {
    mandal: string;
    citizens: number;
    cadres: number;
    grievances: number;
    open: number;
    resolved: number;
  }[];
  recentGrievances: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    citizen?: string;
    department?: string;
    mandal?: string;
    createdAt: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    note?: string;
    by?: string;
    grievanceCode: string;
    grievanceTitle: string;
    toStatus?: string;
    createdAt: string;
  }[];
  grievanceTrend: { date: string; created: number; resolved: number }[];
}
