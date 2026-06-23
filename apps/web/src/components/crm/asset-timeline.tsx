'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import { addAssetLog, type AssetLogItem } from '@/lib/crm';
import { formatDate } from '@/lib/utils';

const LOG_TYPES = ['Inspection', 'Repair', 'Maintenance', 'Cleaning', 'Upgrade', 'Complaint', 'Other'];

export function AssetTimeline({
  assetId,
  logs,
  canEdit,
}: {
  assetId: string;
  logs: AssetLogItem[];
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ type: 'Inspection', note: '', status: '', cost: '', performedBy: '', performedAt: '' });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      addAssetLog(assetId, {
        type: form.type,
        note: form.note || undefined,
        status: form.status || undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        performedBy: form.performedBy || undefined,
        performedAt: form.performedAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', assetId] });
      toast({ title: 'Log added', variant: 'success' });
      setOpen(false);
      setForm({ type: 'Inspection', note: '', status: '', cost: '', performedBy: '', performedAt: '' });
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  return (
    <div className="space-y-3">
      {canEdit && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add log entry
        </Button>
      )}

      {!logs.length ? (
        <EmptyState icon={Wrench} title="No history yet" description="Maintenance, inspections and repairs appear here." />
      ) : (
        <div className="space-y-0">
          {logs.map((l, i) => (
            <div key={l.id} className="relative flex gap-3 pb-5">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-navy" />
                {i < logs.length - 1 && <span className="w-px flex-1 bg-border" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{l.type}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(l.performedAt)}</span>
                </div>
                {l.note && <p className="mt-0.5 text-sm text-muted-foreground">{l.note}</p>}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {l.status && <span>Status: {l.status}</span>}
                  {l.cost != null && <span>Cost: ₹{l.cost.toLocaleString('en-IN')}</span>}
                  {l.performedBy && <span>By: {l.performedBy}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add log entry</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.performedAt} onChange={(e) => set('performedAt', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Input value={form.status} onChange={(e) => set('status', e.target.value)} placeholder="Completed" />
            </div>
            <div className="space-y-1.5">
              <Label>Cost (₹)</Label>
              <Input type="number" value={form.cost} onChange={(e) => set('cost', e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Performed by</Label>
              <Input value={form.performedBy} onChange={(e) => set('performedBy', e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Note</Label>
              <Textarea value={form.note} onChange={(e) => set('note', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Saving…' : 'Add entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
