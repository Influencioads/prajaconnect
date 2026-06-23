'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createDocumentCategory,
  deleteDocumentCategory,
  fetchDocumentCategories,
  updateDocumentCategory,
} from '@/lib/documents';
import { useAuth } from '@/lib/auth';

export default function DocumentCategoriesPage() {
  const [name, setName] = React.useState('');
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('documents'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['documents-categories'],
    queryFn: fetchDocumentCategories,
  });

  const create = useMutation({
    mutationFn: () => createDocumentCategory({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents-categories'] }); setName(''); },
  });

  const update = useMutation({
    mutationFn: () => updateDocumentCategory(editId!, { name: editName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents-categories'] }); setEditId(null); },
  });

  const remove = useMutation({
    mutationFn: deleteDocumentCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents-categories'] }),
  });

  return (
    <>
      <PageHeader title="Document Categories" description="Organize folders by category." />
      {canEdit && (
        <div className="mb-4 flex max-w-md gap-2">
          <div className="flex-1">
            <Label>New category</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <Button className="mt-6" disabled={!name || create.isPending} onClick={() => create.mutate()}>Add</Button>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Folders</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3}>Loading…</TableCell></TableRow> : (data ?? []).map((c: { id: string; name: string; _count: { folders: number } }) => (
              <TableRow key={c.id}>
                <TableCell>
                  {editId === c.id ? (
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : c.name}
                </TableCell>
                <TableCell>{c._count.folders}</TableCell>
                <TableCell className="space-x-2">
                  {canEdit && editId !== c.id && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setEditId(c.id); setEditName(c.name); }}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => remove.mutate(c.id)}>Delete</Button>
                    </>
                  )}
                  {editId === c.id && (
                    <>
                      <Button size="sm" onClick={() => update.mutate()}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
