'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  createUser,
  fetchAdminRoles,
  resetUserPassword,
  updateUser,
  type AdminUser,
} from '@/lib/admin';
import { fetchGeoOptions } from '@/lib/crm';

const STATUSES = ['Active', 'Inactive', 'Suspended'];
const NONE = '__none__';

interface FormState {
  name: string;
  email: string;
  mobile: string;
  password: string;
  roleId: string;
  designation: string;
  status: string;
  constituencyId: string;
  mandalId: string;
}

const EMPTY: FormState = {
  name: '', email: '', mobile: '', password: '', roleId: '',
  designation: '', status: 'Active', constituencyId: '', mandalId: '',
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const editing = !!user;
  const [form, setForm] = React.useState<FormState>(EMPTY);

  const { data: roles } = useQuery({ queryKey: ['admin-roles'], queryFn: fetchAdminRoles, enabled: open });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });

  React.useEffect(() => {
    if (!open) return;
    setForm({
      name: user?.name ?? '',
      email: user?.email ?? '',
      mobile: user?.mobile ?? '',
      password: '',
      roleId: user?.role.id ?? '',
      designation: user?.designation ?? '',
      status: user?.status ?? 'Active',
      constituencyId: user?.constituency?.id ?? '',
      mandalId: user?.mandal?.id ?? '',
    });
  }, [open, user]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mandals = (geo?.mandals ?? []).filter(
    (m) => !form.constituencyId || m.constituencyId === form.constituencyId,
  );

  const saveMut = useMutation({
    mutationFn: () => {
      const base = {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        roleId: form.roleId,
        designation: form.designation || undefined,
        status: form.status,
        constituencyId: form.constituencyId || undefined,
        mandalId: form.mandalId || undefined,
      };
      if (editing && user) return updateUser(user.id, base);
      return createUser({ ...base, password: form.password });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: editing ? 'User updated' : 'User created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Save failed', description: apiError(e), variant: 'error' }),
  });

  const resetMut = useMutation({
    mutationFn: () => resetUserPassword(user!.id, form.password),
    onSuccess: () => {
      toast({ title: 'Password reset', description: 'User must sign in again.', variant: 'success' });
      set('password', '');
    },
    onError: (e) => toast({ title: 'Reset failed', description: apiError(e), variant: 'error' }),
  });

  const valid =
    form.name.trim().length >= 2 &&
    /.+@.+\..+/.test(form.email) &&
    form.mobile.trim().length >= 10 &&
    !!form.roleId &&
    (editing || form.password.length >= 6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit user — ${user?.name}` : 'Add user'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Designation">
            <Input value={form.designation} onChange={(e) => set('designation', e.target.value)} />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Mobile *">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label="Role *">
            <Select value={form.roleId} onValueChange={(v) => set('roleId', v)}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {(roles ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Constituency">
            <Select value={form.constituencyId || NONE}
              onValueChange={(v) => { set('constituencyId', v === NONE ? '' : v); set('mandalId', ''); }}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {(geo?.constituencies ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mandal">
            <Select value={form.mandalId || NONE} onValueChange={(v) => set('mandalId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label={editing ? 'Reset password' : 'Password *'}>
            <div className="flex gap-2">
              <Input type="password" value={form.password} placeholder={editing ? 'New password' : ''}
                onChange={(e) => set('password', e.target.value)} />
              {editing && (
                <Button type="button" variant="outline"
                  disabled={form.password.length < 6 || resetMut.isPending}
                  onClick={() => resetMut.mutate()}>Reset</Button>
              )}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMut.mutate()} disabled={!valid || saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
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
