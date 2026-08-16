'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { KpiCard } from '@/components/ui/kpi-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_TYPES,
  changeServiceRequestStatus,
  createServiceRequest,
  fetchServiceDeskOptions,
  fetchServiceDeskStats,
  fetchServiceRequest,
  fetchServiceRequests,
  forwardServiceRequest,
} from '@/lib/service-desk';
import { useAuth } from '@/lib/auth';

const EMPTY_FORM = { applicantName: '', mobile: '', type: 'IncomeCertificate', details: '', villageId: '' };

export default function ServiceDeskPage() {
  const [status, setStatus] = React.useState('all');
  const [type, setType] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [showNew, setShowNew] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [notes, setNotes] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');

  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('servicedesk'));
  const qc = useQueryClient();

  const filters = {
    status: status === 'all' ? undefined : status,
    type: type === 'all' ? undefined : type,
    search: search || undefined,
    limit: 50,
  };

  const { data: queue, isLoading } = useQuery({
    queryKey: ['service-requests', status, type, search],
    queryFn: () => fetchServiceRequests(filters),
  });
  const { data: stats } = useQuery({ queryKey: ['service-desk-stats'], queryFn: fetchServiceDeskStats });
  const { data: options } = useQuery({ queryKey: ['service-desk-options'], queryFn: fetchServiceDeskOptions });
  const { data: detail } = useQuery({
    queryKey: ['service-request', openId],
    queryFn: () => fetchServiceRequest(openId!),
    enabled: !!openId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['service-requests'] });
    qc.invalidateQueries({ queryKey: ['service-desk-stats'] });
    if (openId) qc.invalidateQueries({ queryKey: ['service-request', openId] });
  };

  const create = useMutation({
    mutationFn: () => createServiceRequest({ ...form, villageId: form.villageId || undefined }),
    onSuccess: () => {
      setShowNew(false);
      setForm(EMPTY_FORM);
      refresh();
    },
  });

  const changeStatus = useMutation({
    mutationFn: (next: string) =>
      changeServiceRequestStatus(openId!, {
        status: next,
        notes: notes || undefined,
        outcome: outcome || undefined,
      }),
    onSuccess: () => {
      setNotes('');
      setOutcome('');
      refresh();
    },
  });

  const forward = useMutation({
    mutationFn: () => forwardServiceRequest(openId!, { departmentId, notes: notes || undefined }),
    onSuccess: () => {
      setNotes('');
      setDepartmentId('');
      refresh();
    },
  });

  const rows = queue?.data ?? [];

  return (
    <>
      <PageHeader
        title="Service Desk"
        description="Citizen certificate, pension and transfer requests — track, forward and close."
        actions={canEdit && <Button onClick={() => setShowNew(true)}>New Request</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total requests" value={stats?.total ?? 0} />
        <KpiCard label="Open" value={(stats?.total ?? 0) - (stats?.byStatus?.Completed ?? 0) - (stats?.byStatus?.Rejected ?? 0)} />
        <KpiCard label="Completed" value={stats?.byStatus?.Completed ?? 0} />
        <KpiCard label="SLA overdue" value={stats?.overdue ?? 0} good={false} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SERVICE_REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s} {stats?.byStatus?.[s] ? `(${stats.byStatus[s]})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {SERVICE_REQUEST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-64"
          placeholder="Search ref no, applicant, mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref No</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">No requests in this queue.</TableCell>
              </TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                <TableCell className="font-medium">{r.refNo}</TableCell>
                <TableCell>
                  {r.applicantName}
                  <span className="block text-xs text-muted-foreground">{r.mobile}</span>
                </TableCell>
                <TableCell className="text-sm">{r.type}</TableCell>
                <TableCell className="text-sm">{r.village?.name ?? '—'}</TableCell>
                <TableCell className="text-sm">{r.department?.name ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  {r.slaDueAt ? (
                    <span className={r.slaStatus === 'Breached' ? 'text-red-600' : ''}>
                      {new Date(r.slaDueAt).toLocaleDateString()}
                      {r.daysOverdue ? <span className="ml-1 text-xs">({r.daysOverdue}d over)</span> : null}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail drawer */}
      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.refNo ?? 'Request'}</DialogTitle>
            <DialogDescription>
              {detail ? `${detail.type} · ${detail.applicantName} · ${detail.mobile}` : 'Loading…'}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-sm">{detail.details}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Status: </span><StatusBadge status={detail.status} /></div>
                <div><span className="text-muted-foreground">Village: </span>{detail.village?.name ?? '—'}</div>
                <div><span className="text-muted-foreground">Department: </span>{detail.department?.name ?? '—'}</div>
                <div>
                  <span className="text-muted-foreground">SLA due: </span>
                  {detail.slaDueAt ? new Date(detail.slaDueAt).toLocaleString() : '—'}
                </div>
                {detail.outcome && (
                  <div className="col-span-2"><span className="text-muted-foreground">Outcome: </span>{detail.outcome}</div>
                )}
              </div>

              {canEdit && (
                <div className="space-y-3 rounded-lg border p-3">
                  <Label>Note for the trail</Label>
                  <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <div>
                    <Label>Outcome (used when completing)</Label>
                    <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_REQUEST_STATUSES.filter((s) => s !== detail.status && s !== 'Forwarded').map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        disabled={changeStatus.isPending}
                        onClick={() => changeStatus.mutate(s)}
                      >
                        Mark {s}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-end gap-2 border-t pt-3">
                    <div className="flex-1">
                      <Label>Forward to department</Label>
                      <Select value={departmentId} onValueChange={setDepartmentId}>
                        <SelectTrigger><SelectValue placeholder="Choose department" /></SelectTrigger>
                        <SelectContent>
                          {(options?.departments ?? []).map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name} ({d.slaHours}h SLA)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button disabled={!departmentId || forward.isPending} onClick={() => forward.mutate()}>
                      Forward
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completing a request sends the applicant an SMS/WhatsApp update (simulated when no gateway is configured).
                  </p>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold">Update trail</h4>
                <ul className="space-y-2">
                  {(detail.updates ?? []).map((u) => (
                    <li key={u.id} className="rounded border p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={u.status} />
                        <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</span>
                      </div>
                      {u.notes && <p className="mt-1">{u.notes}</p>}
                      {u.createdBy && <p className="text-xs text-muted-foreground">by {u.createdBy}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New request */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New service request</DialogTitle>
            <DialogDescription>Log a walk-in or phone request on behalf of a citizen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Applicant name</Label>
              <Input value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_REQUEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Village</Label>
              <Select value={form.villageId} onValueChange={(v) => setForm({ ...form, villageId: v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {(options?.villages ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Details</Label>
              <Textarea rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!form.applicantName || form.mobile.length < 6 || form.details.length < 3 || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Saving…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
