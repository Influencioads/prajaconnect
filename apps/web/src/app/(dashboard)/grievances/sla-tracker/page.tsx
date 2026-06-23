'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlarmClock, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { formatDate } from '@/lib/utils';
import {
  fetchGrievanceOptions,
  fetchSlaTracker,
  fetchSlaViolations,
} from '@/lib/crm';

const ALL = '__all__';

export default function GrievanceSlaTrackerPage() {
  const [tab, setTab] = React.useState<'Resolution' | 'Validation'>('Resolution');
  const [page, setPage] = React.useState(1);
  const [departmentId, setDepartmentId] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [minOverdueDays, setMinOverdueDays] = React.useState(ALL);

  React.useEffect(() => setPage(1), [tab, departmentId, mandalId, minOverdueDays]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['sla-tracker'],
    queryFn: fetchSlaTracker,
  });
  const { data: opts } = useQuery({
    queryKey: ['grievance-options'],
    queryFn: fetchGrievanceOptions,
  });

  const filters = {
    page,
    limit: 20,
    type: tab,
    status: 'Open',
    departmentId: departmentId === ALL ? undefined : departmentId,
    mandalId: mandalId === ALL ? undefined : mandalId,
    minOverdueDays: minOverdueDays === ALL ? undefined : Number(minOverdueDays),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['sla-violations', filters],
    queryFn: () => fetchSlaViolations(filters),
  });

  const mandalOptions = summary?.byMandal ?? [];

  return (
    <>
      <PageHeader
        title="Grievance SLA Tracker"
        description="Monitor validation and resolution deadline breaches. Admins and leaders are alerted when grievances go overdue."
        actions={
          <Button variant="outline" asChild>
            <Link href="/grievances">All grievances</Link>
          </Button>
        }
      />

      {summaryLoading ? (
        <Spinner className="mx-auto" />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Resolution breached"
            value={summary?.openResolutionViolations ?? 0}
            sub={`${summary?.liveResolutionOverdue ?? 0} live overdue`}
            icon={ShieldAlert}
            accent="bg-red-100 text-red-700"
          />
          <KpiCard
            label="Validation breached"
            value={summary?.openValidationViolations ?? 0}
            sub={`${summary?.liveValidationOverdue ?? 0} live overdue`}
            icon={AlertTriangle}
            accent="bg-orange-100 text-orange-700"
          />
          <KpiCard
            label="Total open violations"
            value={summary?.totalOpenViolations ?? 0}
            icon={AlarmClock}
            accent="bg-amber-100 text-amber-700"
          />
          <KpiCard
            label="Avg days overdue"
            value={summary?.avgOverdueDays ?? 0}
            icon={Clock}
            accent="bg-purple-100 text-purple-700"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By department (resolution)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.byDepartment?.length ? (
              <ul className="space-y-2 text-sm">
                {summary.byDepartment.slice(0, 8).map((d) => (
                  <li key={d.departmentId} className="flex justify-between">
                    <span>{d.name}</span>
                    <span className="font-semibold text-red-600">{d.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No open resolution violations by department.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By mandal</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.byMandal?.length ? (
              <ul className="space-y-2 text-sm">
                {summary.byMandal.slice(0, 8).map((m) => (
                  <li key={m.mandalId} className="flex justify-between">
                    <span>{m.name}</span>
                    <span className="font-semibold text-red-600">{m.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No open violations by mandal.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant={tab === 'Resolution' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab('Resolution')}
              >
                Resolution violations
              </Button>
              <Button
                variant={tab === 'Validation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab('Validation')}
              >
                Validation violations
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tab === 'Resolution' && (
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All departments</SelectItem>
                    {(opts?.departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={mandalId} onValueChange={setMandalId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Mandal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All mandals</SelectItem>
                  {mandalOptions.map((m) => (
                    <SelectItem key={m.mandalId} value={m.mandalId}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minOverdueDays} onValueChange={setMinOverdueDays}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Min overdue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any overdue</SelectItem>
                  <SelectItem value="1">1+ days</SelectItem>
                  <SelectItem value="3">3+ days</SelectItem>
                  <SelectItem value="7">7+ days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <Spinner className="mx-auto" />
          ) : !data?.data.length ? (
            <EmptyState title="No open violations" description="All grievances are within SLA for this filter." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Title / issue</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Days overdue</TableHead>
                    <TableHead>{tab === 'Resolution' ? 'Department' : 'Validator'}</TableHead>
                    <TableHead>Mandal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((v) => {
                    const isResolution = v.type === 'Resolution';
                    const ticket = isResolution
                      ? v.grievance?.code
                      : v.tempGrievance?.tempTicketId;
                    const title = isResolution
                      ? v.grievance?.title
                      : v.tempGrievance?.issueSummary;
                    const detailHref = isResolution
                      ? `/grievances/${v.grievance?.id}`
                      : `/temp-grievances/${v.tempGrievance?.id}`;
                    const assignee = isResolution
                      ? v.grievance?.assignedOfficial?.name ?? v.grievance?.assignedCadre?.name ?? '—'
                      : v.tempGrievance?.assignedValidator?.name ?? 'Unassigned';
                    const mandal = isResolution
                      ? v.grievance?.mandal?.name
                      : v.tempGrievance?.mandal?.name;
                    const entityStatus = isResolution
                      ? v.grievance?.status
                      : v.tempGrievance?.validationStatus;

                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">
                          {detailHref ? (
                            <Link href={detailHref} className="text-primary hover:underline">{ticket}</Link>
                          ) : ticket}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">{title ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(v.slaDueAt)}</TableCell>
                        <TableCell>
                          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            {v.overdueDays}d
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {isResolution ? v.grievance?.department?.name ?? '—' : assignee}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{mandal ?? '—'}</TableCell>
                        <TableCell>
                          {entityStatus ? <StatusBadge status={entityStatus} /> : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
