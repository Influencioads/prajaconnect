'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { ElectionStatus } from '@praja/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ElectionListShell } from '@/components/crm/election-views';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { fetchGeoOptions } from '@/lib/crm';
import { formatDate } from '@/lib/utils';
import { createElection, fetchElections, updateElection } from '@/lib/election';

const NONE = '__none__';
const ELECTION_STATUSES = Object.values(ElectionStatus);

type FormState = {
  name: string;
  type: string;
  electionDate: string;
  status: ElectionStatus;
  totalBudget: string;
  description: string;
  constituencyId: string;
};

function emptyForm(): FormState {
  return {
    name: '',
    type: 'Assembly',
    electionDate: '',
    status: ElectionStatus.Planning,
    totalBudget: '',
    description: '',
    constituencyId: NONE,
  };
}

export default function ElectionSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ['election-settings', page],
    queryFn: () => fetchElections({ page, limit: 20 }),
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        type: form.type || undefined,
        electionDate: form.electionDate || undefined,
        status: form.status,
        totalBudget: form.totalBudget ? Number(form.totalBudget) : undefined,
        description: form.description || undefined,
        constituencyId: form.constituencyId === NONE ? undefined : form.constituencyId,
      };
      return editingId ? updateElection(editingId, payload) : createElection(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-settings'] });
      qc.invalidateQueries({ queryKey: ['election-dashboard'] });
      toast({ title: editingId ? 'Election updated' : 'Election created', variant: 'success' });
      setDialog(false);
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDialog(true);
  }

  function openEdit(row: {
    id: string; name: string; type?: string | null; electionDate?: string | null;
    status: ElectionStatus; totalBudget: number; description?: string | null;
    constituency?: { id: string } | null;
  }) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      type: row.type ?? 'Assembly',
      electionDate: row.electionDate ? row.electionDate.slice(0, 10) : '',
      status: row.status,
      totalBudget: String(row.totalBudget ?? ''),
      description: row.description ?? '',
      constituencyId: row.constituency?.id ?? NONE,
    });
    setDialog(true);
  }

  return (
    <ElectionListShell
      title="Election Settings"
      description="Manage elections, budgets and campaign status."
      actions={canEdit ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add election</Button> : undefined}
    >
      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No elections" description="Create an election to start campaign tracking." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Poll date</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-navy">{row.name}</TableCell>
                  <TableCell>{row.type ?? '—'}</TableCell>
                  <TableCell>{row.electionDate ? formatDate(row.electionDate) : '—'}</TableCell>
                  <TableCell>₹{(row.totalBudget / 100000).toFixed(1)}L</TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit election' : 'Create election'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="Assembly, Lok Sabha…" />
              </div>
              <div className="space-y-2">
                <Label>Poll date</Label>
                <Input type="date" value={form.electionDate} onChange={(e) => setForm((f) => ({ ...f, electionDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ElectionStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ELECTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total budget (₹)</Label>
                <Input type="number" min={0} value={form.totalBudget} onChange={(e) => setForm((f) => ({ ...f, totalBudget: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Constituency</Label>
              <Select value={form.constituencyId} onValueChange={(v) => setForm((f) => ({ ...f, constituencyId: v }))}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {geo?.constituencies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button className="bg-gold text-navy hover:bg-gold/90" disabled={!form.name || saveMut.isPending} onClick={() => saveMut.mutate()}>
              {editingId ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ElectionListShell>
  );
}
