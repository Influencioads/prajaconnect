import { Badge, type BadgeProps } from './badge';

const STATUS_MAP: Record<string, BadgeProps['variant']> = {
  // grievance
  Open: 'danger',
  Assigned: 'info',
  InProgress: 'warning',
  Escalated: 'danger',
  Resolved: 'success',
  Closed: 'muted',
  // generic
  Active: 'success',
  Inactive: 'muted',
  Suspended: 'danger',
  OnLeave: 'warning',
  Pending: 'warning',
  Rejected: 'danger',
  Enrolled: 'info',
  Disbursed: 'success',
  // priority
  High: 'danger',
  Medium: 'warning',
  Low: 'muted',
  // project
  Planning: 'info',
  Completed: 'success',
  Delayed: 'danger',
  // events
  Scheduled: 'info',
  Ongoing: 'warning',
  Cancelled: 'muted',
  // survey
  Draft: 'muted',
};

const LABELS: Record<string, string> = {
  InProgress: 'In Progress',
  OnLeave: 'On Leave',
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge variant="muted">—</Badge>;
  const variant = STATUS_MAP[status] ?? 'default';
  return <Badge variant={variant}>{LABELS[status] ?? status}</Badge>;
}
