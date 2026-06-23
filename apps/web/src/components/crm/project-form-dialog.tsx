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
  createProject,
  fetchGeoOptions,
  updateProject,
  type ProjectDetail,
} from '@/lib/crm';

const STATUSES = ['Planning', 'InProgress', 'Completed', 'Delayed'];
const NONE = '__none__';

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectDetail | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    name: '',
    category: '',
    description: '',
    status: 'Planning',
    budget: '',
    spent: '',
    progressPct: '',
    contractor: '',
    mandalId: '',
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: project?.name ?? '',
        category: project?.category ?? '',
        description: project?.description ?? '',
        status: project?.status ?? 'Planning',
        budget: project?.budget != null ? String(project.budget) : '',
        spent: project?.spent != null ? String(project.spent) : '',
        progressPct: project?.progressPct != null ? String(project.progressPct) : '',
        contractor: project?.contractor ?? '',
        mandalId: project?.mandal?.id ?? '',
      });
    }
  }, [open, project]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        category: form.category || undefined,
        description: form.description || undefined,
        status: form.status,
        budget: form.budget ? Number(form.budget) : undefined,
        spent: form.spent ? Number(form.spent) : undefined,
        progressPct: form.progressPct ? Number(form.progressPct) : undefined,
        contractor: form.contractor || undefined,
        mandalId: form.mandalId || undefined,
      };
      return project ? updateProject(project.id, payload) : createProject(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project-stats'] });
      if (project) qc.invalidateQueries({ queryKey: ['project', project.id] });
      toast({ title: project ? 'Project updated' : 'Project created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const valid = form.name.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit project' : 'New development project'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="CC Roads - Atmakur" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Roads, Water…" />
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
          <div className="space-y-1.5">
            <Label>Budget (₹)</Label>
            <Input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Spent (₹)</Label>
            <Input type="number" value={form.spent} onChange={(e) => set('spent', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Progress (%)</Label>
            <Input type="number" min={0} max={100} value={form.progressPct} onChange={(e) => set('progressPct', e.target.value)} />
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
            <Label>Contractor</Label>
            <Input value={form.contractor} onChange={(e) => set('contractor', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving…' : project ? 'Save changes' : 'Create project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
