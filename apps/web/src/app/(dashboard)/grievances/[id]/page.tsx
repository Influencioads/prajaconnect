'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  UserCheck,
  MapPin,
  Phone,
  AlarmClock,
  Star,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  fetchGrievanceDetail,
  fetchGrievanceOptions,
  assignGrievance,
  changeGrievanceStatus,
  addGrievanceNote,
  submitGrievanceFeedback,
  updateGrievance,
} from '@/lib/crm';
import {
  GrievanceSlaTimelinePicker,
  seriousnessFromDays,
  useSlaDaysWithPriority,
} from '@/components/crm/grievance-sla-timeline';

const STATUS_FLOW: Record<string, string[]> = {
  Open: ['Assigned', 'InProgress', 'Closed'],
  Assigned: ['InProgress', 'Escalated', 'Resolved'],
  InProgress: ['Escalated', 'Resolved'],
  Escalated: ['InProgress', 'Resolved'],
  Resolved: ['Closed', 'InProgress'],
  Closed: [],
};
const NONE = '__none__';

export default function GrievanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canEdit = ['edit', 'full'].includes(accessLevel('grievances'));

  const [assignOpen, setAssignOpen] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [rating, setRating] = React.useState(0);
  const [feedbackText, setFeedbackText] = React.useState('');

  const { data: g, isLoading, isError } = useQuery({
    queryKey: ['grievance-detail', id],
    queryFn: () => fetchGrievanceDetail(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['grievance-detail', id] });
    qc.invalidateQueries({ queryKey: ['grievances'] });
    qc.invalidateQueries({ queryKey: ['grievance-stats'] });
  };

  const statusMut = useMutation({
    mutationFn: ({ status, n }: { status: string; n?: string }) =>
      changeGrievanceStatus(id, status, n),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Status updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const noteMut = useMutation({
    mutationFn: () => addGrievanceNote(id, note),
    onSuccess: () => {
      setNote('');
      invalidate();
      toast({ title: 'Note added', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const feedbackMut = useMutation({
    mutationFn: () => submitGrievanceFeedback(id, rating, feedbackText),
    onSuccess: () => {
      setRating(0);
      setFeedbackText('');
      invalidate();
      toast({ title: 'Feedback recorded', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading grievance…" />;
  if (isError || !g) return <EmptyState title="Grievance not found" />;

  const overdue =
    g.slaDueAt && !['Resolved', 'Closed'].includes(g.status) && new Date(g.slaDueAt) < new Date();
  const seriousness = g.slaDays
    ? seriousnessFromDays(g.slaDays)
    : g.seriousness
      ? { ...g.seriousness, description: '' }
      : null;
  const nextStatuses = STATUS_FLOW[g.status] ?? [];

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/grievances')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={g.title}
        description={`${g.code} · logged ${formatDate(g.createdAt)} via ${g.channel}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={g.priority} />
            <StatusBadge status={g.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">{g.description}</p>
              {g.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.photoUrl} alt="evidence" className="max-h-64 rounded-lg border" />
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                  No photo evidence attached.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Category" value={g.category ?? '—'} />
                <Info label="Reporter" value={g.citizen?.name ?? g.reportedByName ?? '—'} />
                <Info label="Reporter mobile" value={g.citizen?.mobile ?? g.reportedByMobile ?? '—'} />
                <Info label="Address" value={g.address ?? '—'} />
              </div>
            </CardContent>
          </Card>

          {canEdit && nextStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Workflow</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant={s === 'Resolved' || s === 'Closed' ? 'default' : 'outline'}
                    size="sm"
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate({ status: s })}
                  >
                    Mark {s}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resolution History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-5">
                {g.updates.map((u) => (
                  <li key={u.id} className="relative">
                    <span className="absolute -left-[1.42rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-gold" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{u.action}</span>
                      {u.toStatus && <StatusBadge status={u.toStatus} />}
                      <span className="text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</span>
                    </div>
                    {u.note && <p className="mt-0.5 text-sm text-muted-foreground">{u.note}</p>}
                    {u.byName && <p className="text-xs text-muted-foreground">by {u.byName}</p>}
                  </li>
                ))}
              </ol>

              {canEdit && (
                <div className="mt-4 flex gap-2">
                  <Textarea
                    placeholder="Add an internal note…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[44px]"
                  />
                  <Button
                    disabled={!note.trim() || noteMut.isPending}
                    onClick={() => noteMut.mutate()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Assignment</CardTitle>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                  Assign
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={Building2} label="Department" value={g.department?.name ?? 'Unassigned'} />
              <Row
                icon={UserCheck}
                label="Official"
                value={g.assignedOfficial ? `${g.assignedOfficial.name}` : 'Unassigned'}
              />
              <Row
                icon={UserCheck}
                label="Cadre"
                value={g.assignedCadre ? g.assignedCadre.name : 'Unassigned'}
              />
              <Row icon={MapPin} label="Mandal" value={g.mandal?.name ?? '—'} />
              <Row icon={MapPin} label="Village" value={g.village?.name ?? '—'} />
              <div
                className={`rounded-lg border p-3 space-y-2 ${
                  overdue ? 'border-red-300 bg-red-50 text-red-700' : 'bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlarmClock className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">Resolution timeline</span>
                </div>
                {seriousness && (
                  <p className="text-xs font-medium">
                    Seriousness: {seriousness.label}
                    {g.slaDays ? ` · ${g.slaDays} day SLA` : ''}
                  </p>
                )}
                <p className="text-xs">
                  Due {g.slaDueAt ? formatDateTime(g.slaDueAt) : '—'}
                  {g.daysRemaining != null && !overdue ? ` · ${g.daysRemaining}d left` : ''}
                  {overdue ? ` · ${g.daysOverdue ?? 0}d OVERDUE` : ''}
                </p>
                {canEdit && !['Resolved', 'Closed'].includes(g.status) && (
                  <SlaEditInline grievanceId={id} currentDays={g.slaDays ?? 3} onDone={invalidate} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Citizen Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {g.satisfactionRating ? (
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-5 w-5 ${
                          n <= (g.satisfactionRating ?? 0)
                            ? 'fill-gold text-gold'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  {g.feedback && <p className="mt-2 text-sm text-muted-foreground">“{g.feedback}”</p>}
                </div>
              ) : canEdit ? (
                <>
                  <Label>Rate resolution</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)}>
                        <Star
                          className={`h-6 w-6 ${
                            n <= rating ? 'fill-gold text-gold' : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Optional comment…"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!rating || feedbackMut.isPending}
                    onClick={() => feedbackMut.mutate()}
                  >
                    Submit feedback
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No feedback recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AssignDialog
        grievanceId={id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        current={{
          departmentId: g.department?.id,
          officialId: g.assignedOfficial?.id,
          cadreId: g.assignedCadre?.id,
          slaDays: g.slaDays ?? undefined,
          priority: g.priority,
        }}
        onDone={invalidate}
      />
    </>
  );
}

function AssignDialog({
  grievanceId,
  open,
  onOpenChange,
  current,
  onDone,
}: {
  grievanceId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  current: {
    departmentId?: string;
    officialId?: string;
    cadreId?: string;
    slaDays?: number;
    priority?: string;
  };
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [departmentId, setDepartmentId] = React.useState(current.departmentId ?? '');
  const [officialId, setOfficialId] = React.useState(current.officialId ?? '');
  const [cadreId, setCadreId] = React.useState(current.cadreId ?? '');

  const { data: opts } = useQuery({
    queryKey: ['grievance-options'],
    queryFn: fetchGrievanceOptions,
    enabled: open,
  });

  const selectedDept = opts?.departments.find((d) => d.id === departmentId);
  const [slaDays, setSlaDays] = useSlaDaysWithPriority(
    current.priority ?? 'Medium',
    selectedDept?.slaHours,
  );

  React.useEffect(() => {
    if (open) {
      setDepartmentId(current.departmentId ?? '');
      setOfficialId(current.officialId ?? '');
      setCadreId(current.cadreId ?? '');
      if (current.slaDays) setSlaDays(current.slaDays);
    }
  }, [open, current, setSlaDays]);

  const officials = (opts?.officials ?? []).filter(
    (o) => !departmentId || o.departmentId === departmentId,
  );

  const mut = useMutation({
    mutationFn: () =>
      assignGrievance(grievanceId, {
        departmentId: departmentId || undefined,
        assignedOfficialId: officialId || undefined,
        assignedCadreId: cadreId || undefined,
        slaDays,
      }),
    onSuccess: () => {
      onDone();
      toast({ title: 'Grievance assigned', variant: 'success' });
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign grievance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select
              value={departmentId || NONE}
              onValueChange={(v) => {
                setDepartmentId(v === NONE ? '' : v);
                setOfficialId('');
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {opts?.departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name} ({d.slaHours}h SLA)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Official</Label>
            <Select value={officialId || NONE} onValueChange={(v) => setOfficialId(v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select official" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {officials.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name} · {o.designation}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cadre (field follow-up)</Label>
            <Select value={cadreId || NONE} onValueChange={(v) => setCadreId(v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select cadre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {opts?.cadres.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} · {c.designation}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <GrievanceSlaTimelinePicker
            slaDays={slaDays}
            onSlaDaysChange={setSlaDays}
            priority={current.priority}
            departmentSlaHours={selectedDept?.slaHours}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? 'Assigning…' : 'Save assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlaEditInline({
  grievanceId,
  currentDays,
  onDone,
}: {
  grievanceId: string;
  currentDays: number;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [slaDays, setSlaDays] = React.useState(currentDays);

  React.useEffect(() => setSlaDays(currentDays), [currentDays]);

  const mut = useMutation({
    mutationFn: () => updateGrievance(grievanceId, { slaDays }),
    onSuccess: () => {
      onDone();
      setOpen(false);
      toast({ title: 'Timeline updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(true)}>
        Adjust days to solve
      </Button>
    );
  }

  return (
    <div className="space-y-2 border-t border-dashed pt-2">
      <GrievanceSlaTimelinePicker slaDays={slaDays} onSlaDaysChange={setSlaDays} />
      <div className="flex gap-2">
        <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
