'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { createCampaign } from '@/lib/crm';

const TYPES = ['CampaignCall', 'SmsCampaign', 'VoiceBroadcast', 'EmailCampaign', 'DoorToDoor', 'FieldOutreach'];
const STATUSES = ['Draft', 'Active', 'Paused', 'Completed', 'Cancelled'];

const initial = {
  name: '',
  type: 'CampaignCall',
  status: 'Draft',
  description: '',
  script: '',
  targetCount: '',
  budget: '',
  startAt: '',
  endAt: '',
};

export function CampaignFormDialog({
  open,
  onOpenChange,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState({ ...initial, type: defaultType ?? initial.type });

  React.useEffect(() => {
    if (open) setForm({ ...initial, type: defaultType ?? initial.type });
  }, [open, defaultType]);

  const set = (k: keyof typeof initial, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      createCampaign({
        name: form.name,
        type: form.type,
        status: form.status,
        description: form.description || undefined,
        script: form.script || undefined,
        targetCount: form.targetCount ? Number(form.targetCount) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const valid = form.name.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Voter outreach drive" />
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
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Call / message script</Label>
            <Textarea value={form.script} onChange={(e) => set('script', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Target count</Label>
            <Input type="number" value={form.targetCount} onChange={(e) => set('targetCount', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Budget</Label>
            <Input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input type="datetime-local" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Creating…' : 'Create campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
