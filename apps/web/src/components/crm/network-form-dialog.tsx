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
  createNetworkRecord,
  updateNetworkRecord,
  fetchGeoOptions,
  fetchCadreParents,
  type NetworkRecord,
} from '@/lib/crm';
import { COMMON_FIELDS, type FieldDef, type NetworkViewConfig } from '@/lib/network-config';

const NONE = '__none__';

export function NetworkFormDialog({
  open,
  onOpenChange,
  config,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: NetworkViewConfig;
  record?: NetworkRecord | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const allFields = React.useMemo(() => [...COMMON_FIELDS, ...config.extraFields], [config]);

  const buildForm = React.useCallback(
    (r?: NetworkRecord | null): Record<string, string> => {
      const f: Record<string, string> = {};
      for (const field of allFields) {
        const v = r?.[field.key];
        if (field.type === 'date' && v) {
          f[field.key] = String(v).slice(0, 10);
        } else {
          f[field.key] = v === null || v === undefined ? '' : String(v);
        }
      }
      f.status = r?.status ?? 'Active';
      f.notes = r?.notes ?? '';
      f.mandalId = r?.mandalId ?? '';
      f.villageId = r?.villageId ?? '';
      f.address = r?.address ?? '';
      f.reportingPersonId = r?.reportingPersonId ?? '';
      return f;
    },
    [allFields],
  );

  const [form, setForm] = React.useState<Record<string, string>>(buildForm(record));

  React.useEffect(() => {
    if (open) setForm(buildForm(record));
  }, [open, record, buildForm]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });
  const { data: cadres } = useQuery({
    queryKey: ['cadre-parents'],
    queryFn: () => fetchCadreParents(),
    enabled: open,
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      for (const field of allFields) {
        const raw = form[field.key];
        if (raw === undefined || raw === '') continue;
        if (field.type === 'number') {
          const n = Number(raw);
          if (Number.isFinite(n)) payload[field.key] = n;
        } else if (field.type === 'date') {
          payload[field.key] = new Date(raw).toISOString();
        } else {
          payload[field.key] = raw;
        }
      }
      payload.status = form.status || 'Active';
      payload.notes = form.notes || undefined;
      payload.address = form.address || undefined;
      payload.mandalId = form.mandalId || undefined;
      payload.villageId = form.villageId || undefined;
      payload.reportingPersonId = form.reportingPersonId || undefined;
      if (config.category) payload.category = config.category;

      return record
        ? updateNetworkRecord(config.resource, record.id, payload)
        : createNetworkRecord(config.resource, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['network', config.key] });
      qc.invalidateQueries({ queryKey: ['network-stats', config.key] });
      qc.invalidateQueries({ queryKey: ['committee-analytics'] });
      if (record) qc.invalidateQueries({ queryKey: ['network-detail', config.resource, record.id] });
      toast({ title: record ? 'Member updated' : 'Member added', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Save failed', description: apiError(err), variant: 'error' }),
  });

  const villages = (geo?.villages ?? []).filter((v) =>
    !form.mandalId ? true : v.mandalId === form.mandalId,
  );

  const valid = (form.fullName ?? '').trim().length >= 2 && (form.mobile ?? '').trim().length >= 7;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? `Edit ${config.title}` : `Add to ${config.title}`}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {COMMON_FIELDS.map((field) => (
            <FieldRenderer key={field.key} field={field} value={form[field.key] ?? ''} onChange={set} />
          ))}

          <Field label="Mandal">
            <Select value={form.mandalId || NONE} onValueChange={(v) => set('mandalId', v === NONE ? '' : v)}>
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
            <Select value={form.villageId || NONE} onValueChange={(v) => set('villageId', v === NONE ? '' : v)}>
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
          <Field label="Reporting Person">
            <Select
              value={form.reportingPersonId || NONE}
              onValueChange={(v) => set('reportingPersonId', v === NONE ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {cadres?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.designation}
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {config.extraFields.map((field) => (
            <FieldRenderer key={field.key} field={field} value={form[field.key] ?? ''} onChange={set} />
          ))}

          <div className="sm:col-span-2">
            <Field label="Address">
              <Input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving…' : record ? 'Save changes' : 'Add member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (k: string, v: string) => void;
}) {
  if (field.type === 'select') {
    return (
      <Field label={field.label}>
        <Select value={value || NONE} onValueChange={(v) => onChange(field.key, v === NONE ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— None —</SelectItem>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div className="sm:col-span-2">
        <Field label={field.label}>
          <Textarea value={value} onChange={(e) => onChange(field.key, e.target.value)} />
        </Field>
      </div>
    );
  }
  return (
    <Field label={field.label}>
      <Input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </Field>
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
