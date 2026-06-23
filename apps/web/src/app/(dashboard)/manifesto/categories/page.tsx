'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPromiseCategory, deletePromiseCategory, fetchPromiseCategories } from '@/lib/manifesto';
import { useAuth } from '@/lib/auth';

export default function ManifestoCategoriesPage() {
  const [page, setPage] = React.useState(1);
  const [name, setName] = React.useState('');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('manifesto'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['manifesto-categories', page],
    queryFn: () => fetchPromiseCategories({ page, limit: 20 }),
  });

  const create = useMutation({
    mutationFn: createPromiseCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manifesto-categories'] }); setName(''); },
  });

  const remove = useMutation({
    mutationFn: deletePromiseCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manifesto-categories'] }),
  });

  return (
    <>
      <PageHeader title="Promise Categories" description="Organize manifesto commitments by theme." />
      {canEdit && (
        <div className="mb-4 flex max-w-md gap-2">
          <div className="flex-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <Button className="mt-6" disabled={!name || create.isPending} onClick={() => create.mutate({ name })}>Add</Button>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Promises</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c._count?.promises ?? 0}</TableCell>
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
