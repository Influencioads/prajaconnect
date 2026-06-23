'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Phone, MapPin, Users2 } from 'lucide-react';
import { ACTIVITY_TYPE_LABELS, ActivityType } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import { apiError } from '@/lib/api';
import {
  fetchActivityDetail,
  addActivityNote,
  addActivityReminder,
  changeActivityStatus,
  completeActivity,
} from '@/lib/crm';

const STATUSES = ['Planned', 'Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoResponse', 'FollowUp'];

function fmtDuration(sec?: number | null): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('activities'));

  const [note, setNote] = React.useState('');
  const [reminderAt, setReminderAt] = React.useState('');
  const [status, setStatus] = React.useState('');

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => fetchActivityDetail(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['activity', id] });
    qc.invalidateQueries({ queryKey: ['activities'] });
  };

  const noteMutation = useMutation({
    mutationFn: () => addActivityNote(id, note),
    onSuccess: () => { setNote(''); invalidate(); toast({ title: 'Note added', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });
  const reminderMutation = useMutation({
    mutationFn: () => addActivityReminder(id, { remindAt: reminderAt }),
    onSuccess: () => { setReminderAt(''); invalidate(); toast({ title: 'Reminder set', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });
  const statusMutation = useMutation({
    mutationFn: (s: string) => changeActivityStatus(id, s),
    onSuccess: () => { invalidate(); toast({ title: 'Status updated', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });
  const completeMutation = useMutation({
    mutationFn: () => completeActivity(id, {}),
    onSuccess: () => { invalidate(); toast({ title: 'Marked complete', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!activity) return <p className="py-20 text-center text-muted-foreground">Activity not found.</p>;

  const typeLabel = ACTIVITY_TYPE_LABELS[activity.type as ActivityType] ?? activity.type;

  return (
    <>
      <PageHeader
        title={activity.title}
        description={`${typeLabel}${activity.code ? ` · ${activity.code}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/activities')}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {canEdit && activity.status !== 'Completed' && (
              <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                <CheckCircle2 className="h-4 w-4" /> Complete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={activity.status} />
                <StatusBadge status={activity.priority} />
                {activity.direction && <span className="text-xs text-muted-foreground">{activity.direction}</span>}
                {activity.outcome && <span className="rounded bg-muted px-2 py-0.5 text-xs">{activity.outcome}</span>}
              </div>
              {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Detail icon={Clock} label="Scheduled" value={formatDateTime(activity.scheduledAt)} />
                <Detail icon={Clock} label="Due" value={formatDateTime(activity.dueAt)} />
                <Detail icon={Phone} label="Duration" value={fmtDuration(activity.durationSec)} />
                <Detail icon={Users2} label="Assigned" value={activity.assignedToUser?.name ?? '—'} />
                <Detail icon={MapPin} label="Location" value={activity.locationName ?? activity.mandal?.name ?? '—'} />
                <Detail icon={Phone} label="Contact" value={activity.citizen?.name ?? activity.contactName ?? activity.contactMobile ?? '—'} />
              </dl>
              {activity.recordingUrl && (
                <a href={activity.recordingUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-primary hover:underline">
                  Listen to recording →
                </a>
              )}
            </CardContent>
          </Card>

          {activity.participants.length > 0 && (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="text-sm font-bold">Participants ({activity.participants.length})</p>
                {activity.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>{p.cadre?.name ?? p.citizen?.name ?? p.user?.name ?? p.name ?? '—'}{p.role ? ` · ${p.role}` : ''}</span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm font-bold">Notes & history</p>
              {canEdit && (
                <div className="flex gap-2">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="min-h-10" />
                  <Button disabled={!note.trim() || noteMutation.isPending} onClick={() => noteMutation.mutate()}>Add</Button>
                </div>
              )}
              <div className="space-y-2">
                {activity.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  activity.notes.map((n) => (
                    <div key={n.id} className="rounded-lg border px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{n.action}{n.toStatus ? ` → ${n.toStatus}` : ''}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                      </div>
                      {n.note && <p className="mt-1 text-sm text-muted-foreground">{n.note}</p>}
                      {n.byName && <p className="mt-0.5 text-xs text-muted-foreground">— {n.byName}</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {canEdit && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <Label>Change status</Label>
                  <div className="flex gap-2">
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button disabled={!status || statusMutation.isPending} onClick={() => statusMutation.mutate(status)}>Set</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Add reminder</Label>
                  <div className="flex gap-2">
                    <Input type="datetime-local" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} />
                    <Button disabled={!reminderAt || reminderMutation.isPending} onClick={() => reminderMutation.mutate()}>Set</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activity.reminders.length > 0 && (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="text-sm font-bold">Reminders</p>
                {activity.reminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>{formatDateTime(r.remindAt)}</span>
                    <StatusBadge status={r.sent ? 'Completed' : 'Scheduled'} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activity.grievance && (
            <Card>
              <CardContent className="space-y-1 pt-6">
                <p className="text-sm font-bold">Linked grievance</p>
                <p className="text-sm text-muted-foreground">{activity.grievance.code} · {activity.grievance.title}</p>
                <StatusBadge status={activity.grievance.status} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}
