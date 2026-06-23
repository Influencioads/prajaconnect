'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCrisisIssue, CRISIS_SEVERITIES, CRISIS_STATUSES, fetchCrisisIssues, updateCrisisIssue } from '@/lib/crisis';
import { useAuth } from '@/lib/auth';

export default function CrisisIssuesPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', description: '', severity: 'Medium' });
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('crisis'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['crisis-issues', page, status],
    queryFn: () => fetchCrisisIssues({ page, limit: 20, status }),
  });

  const create = useMutation({
    mutationFn: createCrisisIssue,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crisis-issues'] }); setShowForm(false); setForm({ title: '', description: '', severity: 'Medium' }); },
  });

  const resolve = useMutation({
    mutationFn: (id: string) => updateCrisisIssue(id, { status: 'Resolved' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crisis-issues'] }),
  });

  return (
    <>
      <PageHeader title="Crisis Issues" description="Track and resolve field-reported critical issues."
        actions={canEdit ? <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Report Issue'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Severity</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {CRISIS_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Submit</Button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={status === '' ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(''); setPage(1); }}>All</Button>
        {CRISIS_STATUSES.map((s) => (
          <Button key={s} variant={status === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(s); setPage(1); }}>{s}</Button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.title}</TableCell>
                <TableCell>{i.village?.name ?? i.mandal?.name ?? '—'}</TableCell>
                <TableCell><StatusBadge status={i.severity} /></TableCell>
                <TableCell><StatusBadge status={i.status} /></TableCell>
                <TableCell>
                  {canEdit && !['Resolved', 'Closed'].includes(i.status) && (
                    <Button size="sm" variant="outline" onClick={() => resolve.mutate(i.id)}>Resolve</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
