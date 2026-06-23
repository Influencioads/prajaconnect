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
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { apiError } from '@/lib/api';
import {
  createRole,
  fetchPermissions,
  updateRole,
  type AdminRole,
} from '@/lib/admin';

const LEVELS = ['none', 'view', 'edit', 'full'] as const;
type Level = (typeof LEVELS)[number];

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: AdminRole | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const editing = !!role;
  const isSystem = !!role?.isSystem;

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: fetchPermissions,
    enabled: open,
  });

  const [name, setName] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [rank, setRank] = React.useState('0');
  const [description, setDescription] = React.useState('');
  const [matrix, setMatrix] = React.useState<Record<string, Level>>({});

  React.useEffect(() => {
    if (!open) return;
    setName(role?.name ?? '');
    setLabel(role?.label ?? '');
    setRank(String(role?.rank ?? 0));
    setDescription(role?.description ?? '');
    const seed: Record<string, Level> = {};
    role?.permissions.forEach((p) => { seed[p.module] = p.accessLevel as Level; });
    setMatrix(seed);
  }, [open, role]);

  const setLevel = (module: string, level: Level) =>
    setMatrix((m) => ({ ...m, [module]: level }));

  const setAll = (level: Level) => {
    if (!permissions) return;
    setMatrix(Object.fromEntries(permissions.map((p) => [p.module, level])));
  };

  const mutation = useMutation({
    mutationFn: () => {
      const perms = (permissions ?? []).map((p) => ({
        module: p.module,
        accessLevel: matrix[p.module] ?? 'none',
      }));
      if (editing && role) {
        return updateRole(role.id, { label, rank: Number(rank), description, permissions: perms });
      }
      return createRole({ name, label, rank: Number(rank), description, permissions: perms });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      toast({ title: editing ? 'Role updated' : 'Role created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Save failed', description: apiError(e), variant: 'error' }),
  });

  const valid = label.trim().length >= 2 && (editing || /^[A-Za-z][A-Za-z0-9_]{1,}$/.test(name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit role — ${role?.label}` : 'Create role'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Key {editing ? '' : '(unique, no spaces)'}</Label>
            <Input id="role-name" value={name} disabled={editing}
              placeholder="e.g. CampaignManager"
              onChange={(e) => setName(e.target.value)} />
            {isSystem && <p className="text-xs text-muted-foreground">Built-in role key cannot change.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-label">Display label</Label>
            <Input id="role-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-rank">Rank (0–100)</Label>
            <Input id="role-rank" type="number" min={0} max={100} value={rank}
              onChange={(e) => setRank(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Module permissions</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Set all:</span>
              {LEVELS.map((l) => (
                <Button key={l} type="button" variant="outline" size="sm"
                  className="h-7 px-2 text-xs capitalize" onClick={() => setAll(l)}>{l}</Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="max-h-[40vh] divide-y overflow-y-auto rounded-lg border">
              {(permissions ?? []).map((p) => {
                const current = matrix[p.module] ?? 'none';
                return (
                  <div key={p.module} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-sm font-medium">{p.label}</span>
                    <div className="flex overflow-hidden rounded-md border">
                      {LEVELS.map((l) => (
                        <button key={l} type="button" onClick={() => setLevel(p.module, l)}
                          className={cn(
                            'px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                            current === l
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background text-muted-foreground hover:bg-muted',
                          )}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
