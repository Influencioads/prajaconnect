'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { createEvent, fetchGeoOptions } from '@/lib/crm';

const TYPES = ['Rally', 'Camp', 'Meeting', 'Awareness', 'Other'];
const NONE = '__none__';

const initial = {
  title: '',
  type: 'Meeting',
  description: '',
  startAt: '',
  endAt: '',
  venue: '',
  mandalId: '',
  expectedAttendees: '',
};

export function EventFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState(initial);

  React.useEffect(() => {
    if (open) setForm(initial);
  }, [open]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });
  const set = (k: keyof typeof initial, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      createEvent({
        title: form.title,
        type: form.type,
        description: form.description || undefined,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        venue: form.venue || undefined,
        mandalId: form.mandalId || undefined,
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event-stats'] });
      toast({ title: 'Event created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const valid = form.title.trim().length >= 3 && !!form.startAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Booth-level cadre meeting" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mandal</Label>
            <Select value={form.mandalId || NONE} onValueChange={(v) => set('mandalId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select mandal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Starts *</Label>
            <Input type="datetime-local" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ends</Label>
            <Input type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Venue</Label>
            <Input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Community hall, Atmakur" />
          </div>
          <div className="space-y-1.5">
            <Label>Expected attendees</Label>
            <Input type="number" value={form.expectedAttendees} onChange={(e) => set('expectedAttendees', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Creating…' : 'Create event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
