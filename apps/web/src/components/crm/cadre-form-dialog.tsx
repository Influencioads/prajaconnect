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
  createCadre,
  updateCadre,
  fetchGeoOptions,
  fetchCadreParents,
  type CadreListItem,
} from '@/lib/crm';

const LEVELS = ['Booth', 'Village', 'Mandal', 'Constituency', 'District', 'State'];
const STATUSES = ['Active', 'OnLeave', 'Inactive'];
const NONE = '__none__';

interface FormState {
  name: string;
  mobile: string;
  email: string;
  designation: string;
  level: string;
  status: string;
  address: string;
  notes: string;
  performance: string;
  parentId: string;
  constituencyId: string;
  mandalId: string;
  boothId: string;
}

function toForm(c?: CadreListItem | null): FormState {
  return {
    name: c?.name ?? '',
    mobile: c?.mobile ?? '',
    email: c?.email ?? '',
    designation: c?.designation ?? '',
    level: c?.level ?? 'Booth',
    status: c?.status ?? 'Active',
    address: c?.address ?? '',
    notes: c?.notes ?? '',
    performance: c?.performance != null ? String(c.performance) : '0',
    parentId: c?.parentId ?? '',
    constituencyId: c?.constituencyId ?? '',
    mandalId: c?.mandalId ?? '',
    boothId: c?.boothId ?? '',
  };
}

export function CadreFormDialog({
  open,
  onOpenChange,
  cadre,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cadre?: CadreListItem | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState<FormState>(toForm(cadre));

  React.useEffect(() => {
    if (open) setForm(toForm(cadre));
  }, [open, cadre]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });
  const { data: parents } = useQuery({
    queryKey: ['cadre-parents', cadre?.id],
    queryFn: () => fetchCadreParents(cadre?.id),
    enabled: open,
  });

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        mobile: form.mobile,
        email: form.email || undefined,
        designation: form.designation,
        level: form.level,
        status: form.status,
        address: form.address || undefined,
        notes: form.notes || undefined,
        performance: Number(form.performance) || 0,
        parentId: form.parentId || undefined,
        constituencyId: form.constituencyId || undefined,
        mandalId: form.mandalId || undefined,
        boothId: form.boothId || undefined,
      };
      return cadre ? updateCadre(cadre.id, payload) : createCadre(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cadre'] });
      qc.invalidateQueries({ queryKey: ['cadre-stats'] });
      qc.invalidateQueries({ queryKey: ['cadre-hierarchy'] });
      if (cadre) qc.invalidateQueries({ queryKey: ['cadre-detail', cadre.id] });
      toast({ title: cadre ? 'Cadre updated' : 'Cadre added', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Save failed', description: apiError(err), variant: 'error' }),
  });

  const booths = (geo?.booths ?? []).filter((b) =>
    !form.mandalId
      ? true
      : geo?.villages.some((v) => v.id === b.villageId && v.mandalId === form.mandalId),
  );

  const valid = form.name.trim().length >= 2 && form.mobile.trim().length >= 7 && form.designation.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cadre ? 'Edit cadre' : 'Add cadre'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ravi Kumar" />
          </Field>
          <Field label="Mobile *">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="9876543210" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@praja.in" />
          </Field>
          <Field label="Designation *">
            <Input
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
              placeholder="Booth President"
            />
          </Field>
          <Field label="Level">
            <Select value={form.level} onValueChange={(v) => set('level', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Mandal">
            <Select
              value={form.mandalId || NONE}
              onValueChange={(v) => set('mandalId', v === NONE ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mandal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {geo?.mandals.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Booth">
            <Select
              value={form.boothId || NONE}
              onValueChange={(v) => set('boothId', v === NONE ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select booth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {booths.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Reports to">
            <Select
              value={form.parentId || NONE}
              onValueChange={(v) => set('parentId', v === NONE ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {parents?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Performance (0-100)">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.performance}
              onChange={(e) => set('performance', e.target.value)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Address">
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving…' : cadre ? 'Save changes' : 'Add cadre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
