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
import { createAttack, fetchAttacks } from '@/lib/media';
import { useAuth } from '@/lib/auth';

export default function MediaAttacksPage() {
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', description: '' });
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media-attacks', page],
    queryFn: () => fetchAttacks({ page, limit: 20 }),
  });

  const create = useMutation({
    mutationFn: createAttack,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media-attacks'] }); setShowForm(false); setForm({ title: '', description: '' }); },
  });

  return (
    <>
      <PageHeader title="Opposition Attacks" description="Track opposition narratives requiring counter-response."
        actions={canEdit ? <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Log Attack'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Save</Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Response Status</TableHead><TableHead>Responses</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell><StatusBadge status={a.responseStatus} /></TableCell>
                <TableCell>{a.responses?.length ?? a._count?.responses ?? 0}</TableCell>
                <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
