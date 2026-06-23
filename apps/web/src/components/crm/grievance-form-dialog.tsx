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
import {
  createGrievance,
  fetchGeoOptions,
  fetchGrievanceOptions,
} from '@/lib/crm';
import {
  GrievanceSlaTimelinePicker,
  useSlaDaysWithPriority,
} from '@/components/crm/grievance-sla-timeline';

const PRIORITIES = ['High', 'Medium', 'Low'];
const CHANNELS = ['Web', 'WhatsApp', 'Voice', 'Field', 'Mobile'];
const NONE = '__none__';

const initial = {
  title: '',
  description: '',
  category: '',
  channel: 'Web',
  priority: 'Medium',
  reportedByName: '',
  reportedByMobile: '',
  departmentId: '',
  mandalId: '',
  villageId: '',
  address: '',
};

export function GrievanceFormDialog({
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
  const { data: opts } = useQuery({
    queryKey: ['grievance-options'],
    queryFn: fetchGrievanceOptions,
    enabled: open,
  });

  const selectedDept = opts?.departments.find((d) => d.id === form.departmentId);
  const [slaDays, setSlaDays] = useSlaDaysWithPriority(form.priority, selectedDept?.slaHours);

  const set = (k: keyof typeof initial, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const villages = (geo?.villages ?? []).filter((v) => !form.mandalId || v.mandalId === form.mandalId);

  const mutation = useMutation({
    mutationFn: () =>
      createGrievance({
        title: form.title,
        description: form.description,
        category: form.category || undefined,
        channel: form.channel,
        priority: form.priority,
        reportedByName: form.reportedByName || undefined,
        reportedByMobile: form.reportedByMobile || undefined,
        departmentId: form.departmentId || undefined,
        mandalId: form.mandalId || undefined,
        villageId: form.villageId || undefined,
        address: form.address || undefined,
        slaDays,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grievances'] });
      qc.invalidateQueries({ queryKey: ['grievance-stats'] });
      toast({ title: 'Grievance logged', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const valid = form.title.trim().length >= 4 && form.description.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log new grievance</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Street light not working" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description *</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Roads, Water…" />
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
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={form.channel} onValueChange={(v) => set('channel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={form.departmentId || NONE} onValueChange={(v) => set('departmentId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Route to department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Unassigned —</SelectItem>
                {opts?.departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <GrievanceSlaTimelinePicker
              slaDays={slaDays}
              onSlaDaysChange={setSlaDays}
              priority={form.priority}
              departmentSlaHours={selectedDept?.slaHours}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Reporter name</Label>
            <Input value={form.reportedByName} onChange={(e) => set('reportedByName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reporter mobile</Label>
            <Input value={form.reportedByMobile} onChange={(e) => set('reportedByMobile', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mandal</Label>
            <Select
              value={form.mandalId || NONE}
              onValueChange={(v) => setForm((f) => ({ ...f, mandalId: v === NONE ? '' : v, villageId: '' }))}
            >
              <SelectTrigger><SelectValue placeholder="Select mandal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Village</Label>
            <Select value={form.villageId || NONE} onValueChange={(v) => set('villageId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Address / landmark</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Logging…' : 'Log grievance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
