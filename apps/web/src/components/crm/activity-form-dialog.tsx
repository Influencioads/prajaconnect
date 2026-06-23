'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ACTIVITY_TYPE_LABELS, ActivityType } from '@praja/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import { createActivity, fetchActivityOptions } from '@/lib/crm';

const STATUSES = ['Planned', 'Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoResponse', 'FollowUp'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const DIRECTIONS = ['Inbound', 'Outbound', 'Missed'];
const NONE = '__none__';

const ALL_TYPES = Object.values(ActivityType);

function initialForm(defaultType: string) {
  return {
    type: defaultType,
    title: '',
    description: '',
    status: 'Planned',
    priority: 'Medium',
    direction: '',
    outcome: '',
    scheduledAt: '',
    dueAt: '',
    durationSec: '',
    contactName: '',
    contactMobile: '',
    locationName: '',
    assignedToUserId: '',
    mandalId: '',
    campaignId: '',
    reminderAt: '',
  };
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  defaultType = ActivityType.Call,
  lockType = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: string;
  lockType?: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState(() => initialForm(defaultType));

  React.useEffect(() => {
    if (open) setForm(initialForm(defaultType));
  }, [open, defaultType]);

  const { data: opts } = useQuery({ queryKey: ['activity-options'], queryFn: fetchActivityOptions, enabled: open });

  const set = (k: keyof ReturnType<typeof initialForm>, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      createActivity({
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        direction: form.direction || undefined,
        outcome: form.outcome || undefined,
        scheduledAt: form.scheduledAt || undefined,
        dueAt: form.dueAt || undefined,
        durationSec: form.durationSec ? Number(form.durationSec) : undefined,
        contactName: form.contactName || undefined,
        contactMobile: form.contactMobile || undefined,
        locationName: form.locationName || undefined,
        assignedToUserId: form.assignedToUserId || undefined,
        mandalId: form.mandalId || undefined,
        campaignId: form.campaignId || undefined,
        reminderAt: form.reminderAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['activity-stats'] });
      qc.invalidateQueries({ queryKey: ['activity-calendar'] });
      toast({ title: 'Activity logged', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const valid = form.title.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)} disabled={lockType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Call with citizen, booth visit…" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description / notes</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select value={form.direction || NONE} onValueChange={(v) => set('direction', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Scheduled at</Label>
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Due at</Label>
            <Input type="datetime-local" value={form.dueAt} onChange={(e) => set('dueAt', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Input value={form.outcome} onChange={(e) => set('outcome', e.target.value)} placeholder="Connected, Converted…" />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (seconds)</Label>
            <Input type="number" value={form.durationSec} onChange={(e) => set('durationSec', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact name</Label>
            <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact mobile</Label>
            <Input value={form.contactMobile} onChange={(e) => set('contactMobile', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Assigned to</Label>
            <Select value={form.assignedToUserId || NONE} onValueChange={(v) => set('assignedToUserId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Unassigned —</SelectItem>
                {opts?.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mandal</Label>
            <Select value={form.mandalId || NONE} onValueChange={(v) => set('mandalId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {opts?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Campaign</Label>
            <Select value={form.campaignId || NONE} onValueChange={(v) => set('campaignId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {opts?.campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={form.locationName} onChange={(e) => set('locationName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Follow-up reminder</Label>
            <Input type="datetime-local" value={form.reminderAt} onChange={(e) => set('reminderAt', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving…' : 'Save activity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
