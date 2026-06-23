'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClipping, deleteClipping, fetchClippings } from '@/lib/media';
import { useAuth } from '@/lib/auth';

export default function MediaClippingsPage() {
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', fileUrl: '' });
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media-clippings', page],
    queryFn: () => fetchClippings({ page, limit: 20 }),
  });

  const create = useMutation({
    mutationFn: createClipping,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media-clippings'] }); setShowForm(false); setForm({ title: '', fileUrl: '' }); },
  });

  const remove = useMutation({
    mutationFn: deleteClipping,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-clippings'] }),
  });

  return (
    <>
      <PageHeader title="Press Clippings" description="Archived newspaper and media clippings."
        actions={canEdit ? <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Clipping'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>File URL</Label><Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} /></div>
          <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Save</Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Clip Date</TableHead><TableHead>File</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell>{new Date(c.clipDate).toLocaleDateString()}</TableCell>
                <TableCell>{c.fileUrl ? <a href={c.fileUrl} className="text-navy hover:underline" target="_blank" rel="noreferrer">View</a> : '—'}</TableCell>
                <TableCell>{canEdit && <Button size="sm" variant="outline" onClick={() => remove.mutate(c.id)}>Delete</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
