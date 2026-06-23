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
import {
  createPermissionRequest,
  fetchPermissionRequest,
  fetchPermissionRequests,
  PERMISSION_STATUSES,
  PERMISSION_TYPES,
  updatePermissionRequest,
} from '@/lib/compliance';
import { useAuth } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';

export default function CompliancePermissionsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('');
  const [type, setType] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ type: 'Rally', title: '' });
  const searchParams = useSearchParams();
  const detailId = searchParams.get('id');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('compliance'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-permissions', page, status, type],
    queryFn: () => fetchPermissionRequests({ page, limit: 20, status, type }),
  });

  const { data: detail } = useQuery({
    queryKey: ['compliance-permission', detailId],
    queryFn: () => fetchPermissionRequest(detailId!),
    enabled: !!detailId,
  });

  const create = useMutation({
    mutationFn: createPermissionRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-permissions'] });
      setShowForm(false);
      setForm({ type: 'Rally', title: '' });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: string }) => updatePermissionRequest(id, { status: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance-permissions'] }),
  });

  return (
    <>
      <PageHeader
        title="Permission Requests"
        description="Rally, vehicle, event, loudspeaker, and police permissions."
        actions={canEdit ? <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Request'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 rounded-lg border p-4 space-y-3 max-w-md">
          <div>
            <Label>Type</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {PERMISSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Permission title" />
          </div>
          <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Submit</Button>
        </div>
      )}

      {detail && (
        <div className="mb-4 rounded-lg border p-4">
          <h3 className="font-semibold">{detail.title}</h3>
          <p className="text-sm text-muted-foreground">{detail.type} · <StatusBadge status={detail.status} /></p>
          {detail.documents?.length ? (
            <ul className="mt-2 text-sm">
              {detail.documents.map((d) => (
                <li key={d.id}><a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-navy hover:underline">{d.fileName ?? d.fileUrl}</a></li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={status === '' ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(''); setPage(1); }}>All</Button>
        {PERMISSION_STATUSES.map((s) => (
          <Button key={s} variant={status === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(s); setPage(1); }}>{s}</Button>
        ))}
        <select className="rounded-md border px-2 py-1 text-sm" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {PERMISSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>{r.documents?.length ?? 0}</TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {canEdit && r.status === 'Pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => update.mutate({ id: r.id, status: 'Approved' })}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => update.mutate({ id: r.id, status: 'Rejected' })}>Reject</Button>
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
