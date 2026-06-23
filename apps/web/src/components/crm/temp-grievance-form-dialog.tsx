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
import { createTempGrievance, fetchGeoOptions } from '@/lib/crm';

const SOURCES = ['Manual', 'Call', 'WhatsApp', 'D2DSurvey', 'Email', 'SMS', 'FieldVisit', 'VolunteerNote'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const NONE = '__none__';

const initial = {
  source: 'Manual',
  citizenName: '',
  mobileNumber: '',
  issueCategory: '',
  issueSummary: '',
  issueDescription: '',
  priority: 'Medium',
  mandalId: '',
  villageId: '',
  address: '',
};

export function TempGrievanceFormDialog({
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
  const villages = (geo?.villages ?? []).filter((v) => !form.mandalId || v.mandalId === form.mandalId);

  const mutation = useMutation({
    mutationFn: () =>
      createTempGrievance({
        source: form.source,
        citizenName: form.citizenName || undefined,
        mobileNumber: form.mobileNumber || undefined,
        issueCategory: form.issueCategory || undefined,
        issueSummary: form.issueSummary || undefined,
        issueDescription: form.issueDescription,
        priority: form.priority,
        mandalId: form.mandalId || undefined,
        villageId: form.villageId || undefined,
        address: form.address || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['temp-grievances'] });
      qc.invalidateQueries({ queryKey: ['temp-grievance-analytics'] });
      toast({ title: 'Temp grievance created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const valid = form.issueDescription.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Temp Grievance</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(v) => set('source', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Citizen name</Label>
              <Input value={form.citizenName} onChange={(e) => set('citizenName', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Mobile</Label>
              <Input value={form.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={form.issueCategory} onChange={(e) => set('issueCategory', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Summary</Label>
            <Input value={form.issueSummary} onChange={(e) => set('issueSummary', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Description *</Label>
            <Textarea rows={4} value={form.issueDescription} onChange={(e) => set('issueDescription', e.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Mandal</Label>
              <Select value={form.mandalId || NONE} onValueChange={(v) => { set('mandalId', v === NONE ? '' : v); set('villageId', ''); }}>
                <SelectTrigger><SelectValue placeholder="Select mandal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(geo?.mandals ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Village</Label>
              <Select value={form.villageId || NONE} onValueChange={(v) => set('villageId', v === NONE ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
