'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, MessageSquareWarning, AlarmClock, CheckCircle2, Inbox } from 'lucide-react';
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
import { GrievanceFormDialog } from '@/components/crm/grievance-form-dialog';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import {
  fetchGrievances,
  fetchGrievanceStats,
  fetchGrievanceOptions,
} from '@/lib/crm';

const ALL = '__all__';

export default function GrievancesPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('grievances'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [priority, setPriority] = React.useState(ALL);
  const [departmentId, setDepartmentId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, status, priority, departmentId]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status === ALL ? undefined : status,
    priority: priority === ALL ? undefined : priority,
    departmentId: departmentId === ALL ? undefined : departmentId,
  };

  const { data: stats } = useQuery({ queryKey: ['grievance-stats'], queryFn: fetchGrievanceStats });
  const { data: opts } = useQuery({ queryKey: ['grievance-options'], queryFn: fetchGrievanceOptions });
  const { data, isLoading } = useQuery({
    queryKey: ['grievances', filters],
    queryFn: () => fetchGrievances(filters),
  });

  return (
    <>
      <PageHeader
        title="Grievance Redressal"
        description="Track, assign and resolve citizen complaints with SLA monitoring."
        actions={
          canEdit ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Log grievance
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total" value={stats?.total ?? 0} icon={MessageSquareWarning} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Open" value={stats?.open ?? 0} icon={Inbox} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <Link href="/grievances/sla-tracker" className="block transition-opacity hover:opacity-90">
          <KpiCard label="SLA Overdue" value={stats?.overdue ?? 0} icon={AlarmClock} accent="bg-red-100 text-red-700" />
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title, code, description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <FilterSelect value={status} onChange={setStatus} placeholder="Status" options={['Open', 'Assigned', 'InProgress', 'Escalated', 'Resolved', 'Closed']} />
            <FilterSelect value={priority} onChange={setPriority} placeholder="Priority" options={['High', 'Medium', 'Low']} />
            <FilterSelect
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Department"
              options={(opts?.departments ?? []).map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No grievances found" description="Adjust filters or log a new grievance." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Mandal</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Logged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((g) => {
                    const slaLabel =
                      g.slaStatus === 'Breached'
                        ? `${g.daysOverdue ?? 0}d overdue`
                        : g.slaStatus === 'DueSoon'
                          ? `${g.daysRemaining ?? 0}d left`
                          : g.slaStatus === 'OnTrack'
                            ? `${g.daysRemaining ?? 0}d left`
                            : '—';
                    const slaClass =
                      g.slaStatus === 'Breached'
                        ? 'text-red-600 font-semibold'
                        : g.slaStatus === 'DueSoon'
                          ? 'text-amber-600 font-medium'
                          : 'text-muted-foreground';

                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono text-xs">{g.code}</TableCell>
                        <TableCell>
                          <Link href={`/grievances/${g.id}`} className="font-semibold text-foreground hover:text-primary">
                            {g.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{g.citizen?.name ?? g.category ?? '—'}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.department?.name ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.mandal?.name ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={g.priority} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <StatusBadge status={g.status} />
                          </div>
                        </TableCell>
                        <TableCell className={`text-sm ${slaClass}`}>{slaLabel}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(g.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <GrievanceFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}

type Option = string | { value: string; label: string };

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Option[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="sm:w-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return <SelectItem key={val} value={val}>{label}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}
