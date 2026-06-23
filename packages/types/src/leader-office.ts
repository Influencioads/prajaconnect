export type AppointmentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface AppointmentRequest {
  id: string;
  visitorName: string;
  mobile?: string | null;
  purpose: string;
  status: AppointmentStatus;
  scheduledAt?: string | null;
  createdAt: string;
}

export interface LeaderScheduleBlock {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface LeaderCalendarItem {
  id: string;
  kind: 'appointment' | 'schedule';
  title: string;
  status?: AppointmentStatus;
  startAt: string;
  endAt?: string;
  date: string;
}

export interface LeaderCalendarResponse {
  from: string;
  to: string;
  items: LeaderCalendarItem[];
}

export interface LeaderOfficeDashboard {
  pendingAppointments: number;
  todayAppointments: number;
  visitorsToday: number;
  activeVisitors: number;
  upcomingSchedule: LeaderScheduleBlock[];
  recentAppointments: AppointmentRequest[];
}
