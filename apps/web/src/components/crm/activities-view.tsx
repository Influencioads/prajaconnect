'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Activity as ActivityIcon, CalendarClock, AlarmClock, CheckCircle2 } from 'lucide-react';
import { ACTIVITY_TYPE_LABELS, ActivityType } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ActivityFormDialog } from '@/components/crm/activity-form-dialog';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import { fetchActivities, fetchActivityStats } from '@/lib/crm';

const ALL = '__all__';
const STATUSES = ['Planned', 'Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoResponse', 'FollowUp'];
const PRIORITIES = ['High', 'Medium', 'Low'];

function fmtDuration(sec?: number | null): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

export function ActivitiesView({
  title,
  description,
  lockedType,
  typeOptions,
}: {
  title: string;
  description?: string;
  lockedType?: ActivityType;
  typeOptions?: ActivityType[];
}) {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('activities'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [type, setType] = React.useState<string>(lockedType ?? ALL);
  const [status, setStatus] = React.useState(ALL);
  const [priority, setPriority] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, type, status, priority]);

  const effectiveType = lockedType ?? (type === ALL ? undefined : type);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    type: effectiveType,
    status: status === ALL ? undefined : status,
    priority: priority === ALL ? undefined : priority,
  };

  const { data: stats } = useQuery({
    queryKey: ['activity-stats', lockedType ?? null],
    queryFn: () => fetchActivityStats(lockedType),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['activities', filters],
    queryFn: () => fetchActivities(filters),
  });

  const showTypeColumn = !lockedType;
  const dropdownTypes = typeOptions ?? Object.values(ActivityType);

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          canEdit ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Log activity
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total" value={stats?.total ?? 0} icon={ActivityIcon} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Today" value={stats?.today ?? 0} icon={CalendarClock} accent="bg-indigo-100 text-indigo-700" />
        <KpiCard label="Overdue" value={stats?.overdue ?? 0} icon={AlarmClock} accent="bg-red-100 text-red-700" />
        <KpiCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title, contact, outcome…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!lockedType && (
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="sm:w-48"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All types</SelectItem>
                  {dropdownTypes.map((t) => (
                    <SelectItem key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="sm:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All priority</SelectItem>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No activities found" description="Adjust filters or log a new activity." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    {showTypeColumn && <TableHead>Type</TableHead>}
                    <TableHead>Contact</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link href={`/activities/${a.id}`} className="font-semibold text-foreground hover:text-primary">
                          {a.title}
                        </Link>
                        {a.outcome && <p className="text-xs text-muted-foreground">{a.outcome}</p>}
                      </TableCell>
                      {showTypeColumn && (
                        <TableCell className="text-sm text-muted-foreground">
                          {ACTIVITY_TYPE_LABELS[a.type as ActivityType] ?? a.type}
                        </TableCell>
                      )}
                      <TableCell className="text-sm text-muted-foreground">
                        {a.citizen?.name ?? a.contactName ?? a.contactMobile ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.assignedToUser?.name ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={a.priority} /></TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDuration(a.durationSec)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(a.scheduledAt ?? a.dueAt ?? a.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultType={lockedType ?? ActivityType.Call}
        lockType={!!lockedType}
      />
    </>
  );
}
