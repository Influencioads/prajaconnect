'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CalendarClock, CheckCircle2, UserCheck, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { EventFormDialog } from '@/components/crm/event-form-dialog';
import { fetchEvents, fetchEventStats } from '@/lib/crm';
import { formatDateTime } from '@/lib/utils';

const ALL = '__all__';
const STATUSES = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'];
const TYPES = ['Rally', 'Camp', 'Meeting', 'Awareness', 'Other'];

export default function EventsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [type, setType] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats } = useQuery({ queryKey: ['event-stats'], queryFn: fetchEventStats });
  const { data, isLoading } = useQuery({
    queryKey: ['events', debounced, status, type, page],
    queryFn: () =>
      fetchEvents({
        search: debounced || undefined,
        status: status === ALL ? undefined : status,
        type: type === ALL ? undefined : type,
        page,
        limit: 20,
      }),
  });

  return (
    <>
      <PageHeader
        title="Events"
        description="Rallies, camps, meetings and field programmes."
        actions={
          <Button onClick={() => setDialog(true)}>
            <Plus className="h-4 w-4" /> Create event
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total events" value={stats?.total ?? 0} icon={CalendarDays} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Upcoming" value={stats?.upcoming ?? 0} icon={CalendarClock} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <KpiCard label="Check-ins" value={stats?.checkedIn ?? 0} icon={UserCheck} accent="bg-purple-100 text-purple-700" />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No events found" description="Create an event to start tracking attendance." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Mandal</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((e) => (
                    <TableRow key={e.id} className="cursor-pointer" onClick={() => router.push(`/events/${e.id}`)}>
                      <TableCell>
                        <p className="font-medium text-foreground">{e.title}</p>
                        {e.venue && <p className="text-xs text-muted-foreground">{e.venue}</p>}
                      </TableCell>
                      <TableCell><Badge variant="muted">{e.type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(e.startAt)}</TableCell>
                      <TableCell className="text-sm">{e.mandal?.name ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {e._count.attendees}
                        {e.expectedAttendees ? <span className="text-muted-foreground"> / {e.expectedAttendees}</span> : null}
                      </TableCell>
                      <TableCell><StatusBadge status={e.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.meta && (
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EventFormDialog open={dialog} onOpenChange={setDialog} />
    </>
  );
}
