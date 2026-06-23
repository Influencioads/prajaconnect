'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPromise, fetchPromises, PROMISE_WORK_STATUSES } from '@/lib/manifesto';
import { useAuth } from '@/lib/auth';

export default function ManifestoPromisesPage() {
  const [page, setPage] = React.useState(1);
  const [workStatus, setWorkStatus] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', department: '', completionPct: 0 });
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('manifesto'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['manifesto-promises', page, workStatus],
    queryFn: () => fetchPromises({ page, limit: 20, workStatus }),
  });

  const create = useMutation({
    mutationFn: createPromise,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manifesto-promises'] }); setShowForm(false); setForm({ title: '', department: '', completionPct: 0 }); },
  });

  return (
    <>
      <PageHeader title="Election Promises" description="Track manifesto commitments and progress."
        actions={canEdit ? <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Promise'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Save</Button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={workStatus === '' ? 'default' : 'outline'} size="sm" onClick={() => { setWorkStatus(''); setPage(1); }}>All</Button>
        {PROMISE_WORK_STATUSES.map((s) => (
          <Button key={s} variant={workStatus === s ? 'default' : 'outline'} size="sm" onClick={() => { setWorkStatus(s); setPage(1); }}>{s}</Button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell><Link href={`/manifesto/promises/${p.id}`} className="font-medium text-navy hover:underline">{p.title}</Link></TableCell>
                <TableCell>{p.category?.name ?? '—'}</TableCell>
                <TableCell>{p.department ?? '—'}</TableCell>
                <TableCell><StatusBadge status={p.workStatus} /></TableCell>
                <TableCell>{p.completionPct}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
