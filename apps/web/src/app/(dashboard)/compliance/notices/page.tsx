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
import { createLegalNotice, deleteLegalNotice, fetchLegalNotices, updateLegalNotice } from '@/lib/compliance';
import { useAuth } from '@/lib/auth';

export default function ComplianceNoticesPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', reference: '' });
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('compliance'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-notices', page, status],
    queryFn: () => fetchLegalNotices({ page, limit: 20, status }),
  });

  const create = useMutation({
    mutationFn: createLegalNotice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-notices'] });
      setShowForm(false);
      setForm({ title: '', reference: '' });
    },
  });

  const close = useMutation({
    mutationFn: (id: string) => updateLegalNotice(id, { status: 'Closed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance-notices'] }),
  });

  const remove = useMutation({
    mutationFn: deleteLegalNotice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance-notices'] }),
  });

  return (
    <>
      <PageHeader
        title="Legal Notices"
        description="Election commission notices, court orders, and legal references."
        actions={canEdit ? <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Notice'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Reference</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="ECI/2024/123" /></div>
          <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Save</Button>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <Button variant={status === '' ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(''); setPage(1); }}>All</Button>
        <Button variant={status === 'Open' ? 'default' : 'outline'} size="sm" onClick={() => { setStatus('Open'); setPage(1); }}>Open</Button>
        <Button variant={status === 'Closed' ? 'default' : 'outline'} size="sm" onClick={() => { setStatus('Closed'); setPage(1); }}>Closed</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-medium">{n.title}</TableCell>
                <TableCell>{n.reference ?? '—'}</TableCell>
                <TableCell><StatusBadge status={n.status} /></TableCell>
                <TableCell>{n.documents?.length ?? 0}</TableCell>
                <TableCell>{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex gap-1">
                      {n.status === 'Open' && <Button size="sm" variant="outline" onClick={() => close.mutate(n.id)}>Close</Button>}
                      <Button size="sm" variant="outline" onClick={() => remove.mutate(n.id)}>Delete</Button>
                    </div>
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
