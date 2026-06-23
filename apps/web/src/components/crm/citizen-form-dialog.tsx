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
  createCitizen,
  updateCitizen,
  fetchGeoOptions,
  fetchFamilies,
  type CitizenListItem,
} from '@/lib/crm';

const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['Active', 'Inactive', 'Deceased', 'Migrated'];
const NONE = '__none__';

interface FormState {
  name: string;
  mobile: string;
  gender: string;
  age: string;
  voterId: string;
  occupation: string;
  category: string;
  address: string;
  status: string;
  notes: string;
  familyId: string;
  isFamilyHead: boolean;
  mandalId: string;
  villageId: string;
  boothId: string;
}

function toForm(c?: CitizenListItem | null): FormState {
  return {
    name: c?.name ?? '',
    mobile: c?.mobile ?? '',
    gender: c?.gender ?? '',
    age: c?.age != null ? String(c.age) : '',
    voterId: c?.voterId ?? '',
    occupation: c?.occupation ?? '',
    category: c?.category ?? '',
    address: '',
    status: c?.status ?? 'Active',
    notes: '',
    familyId: c?.familyId ?? '',
    isFamilyHead: c?.isFamilyHead ?? false,
    mandalId: c?.mandalId ?? '',
    villageId: c?.villageId ?? '',
    boothId: c?.boothId ?? '',
  };
}

export function CitizenFormDialog({
  open,
  onOpenChange,
  citizen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citizen?: CitizenListItem | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState<FormState>(toForm(citizen));

  React.useEffect(() => {
    if (open) setForm(toForm(citizen));
  }, [open, citizen]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });
  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: () => fetchFamilies(),
    enabled: open,
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const villages = (geo?.villages ?? []).filter((v) => !form.mandalId || v.mandalId === form.mandalId);
  const booths = (geo?.booths ?? []).filter((b) => !form.villageId || b.villageId === form.villageId);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        mobile: form.mobile || undefined,
        gender: form.gender || undefined,
        age: form.age ? Number(form.age) : undefined,
        voterId: form.voterId || undefined,
        occupation: form.occupation || undefined,
        category: form.category || undefined,
        address: form.address || undefined,
        status: form.status,
        notes: form.notes || undefined,
        familyId: form.familyId || undefined,
        isFamilyHead: form.isFamilyHead,
        mandalId: form.mandalId || undefined,
        villageId: form.villageId || undefined,
        boothId: form.boothId || undefined,
      };
      return citizen ? updateCitizen(citizen.id, payload) : createCitizen(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citizens'] });
      qc.invalidateQueries({ queryKey: ['citizen-stats'] });
      if (citizen) qc.invalidateQueries({ queryKey: ['citizen-detail', citizen.id] });
      toast({ title: citizen ? 'Citizen updated' : 'Citizen added', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Save failed', description: apiError(err), variant: 'error' }),
  });

  const valid = form.name.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{citizen ? 'Edit citizen' : 'Add citizen'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Mobile">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label="Gender">
            <Select
              value={form.gender || NONE}
              onValueChange={(v) => set('gender', v === NONE ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Age">
            <Input type="number" value={form.age} onChange={(e) => set('age', e.target.value)} />
          </Field>
          <Field label="Voter ID">
            <Input value={form.voterId} onChange={(e) => set('voterId', e.target.value)} />
          </Field>
          <Field label="Occupation">
            <Input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="OC / BC / SC / ST"
            />
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
              onValueChange={(v) =>
                setForm((f) => ({ ...f, mandalId: v === NONE ? '' : v, villageId: '', boothId: '' }))
              }
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
          <Field label="Village">
            <Select
              value={form.villageId || NONE}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, villageId: v === NONE ? '' : v, boothId: '' }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select village" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {villages.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
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
          <Field label="Family">
            <Select
              value={form.familyId || NONE}
              onValueChange={(v) => set('familyId', v === NONE ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {families?.map((fam) => (
                  <SelectItem key={fam.id} value={fam.id}>
                    {fam.headName} ({fam._count.members})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="isHead"
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={form.isFamilyHead}
              onChange={(e) => set('isFamilyHead', e.target.checked)}
            />
            <Label htmlFor="isHead" className="cursor-pointer">
              This person is the family head
            </Label>
          </div>

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
            {mutation.isPending ? 'Saving…' : citizen ? 'Save changes' : 'Add citizen'}
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
