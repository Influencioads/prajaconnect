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
import { createNews, fetchNews } from '@/lib/media';
import { useAuth } from '@/lib/auth';

export default function MediaNewsPage() {
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', source: '', sentiment: 'Neutral' });
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media-news', page],
    queryFn: () => fetchNews({ page, limit: 20 }),
  });

  const create = useMutation({
    mutationFn: createNews,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-news'] });
      setShowForm(false);
      setForm({ title: '', source: '', sentiment: 'Neutral' });
    },
  });

  return (
    <>
      <PageHeader
        title="News Articles"
        description="Track media coverage and sentiment."
        actions={canEdit ? <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Article'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
          <div>
            <Label>Sentiment</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </div>
          <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Save</Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>AI</TableHead>
              <TableHead>Mentions</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-medium">{n.title}</TableCell>
                <TableCell>{n.source ?? '—'}</TableCell>
                <TableCell>{n.sentiment ? <StatusBadge status={n.sentiment} /> : '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {n.contentHash && <StatusBadge status="AI Ingested" />}
                    {n.importanceScore != null && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{n.importanceScore}</span>
                    )}
                    {n.aiSeverity && n.aiSeverity !== 'Low' && <StatusBadge status={n.aiSeverity} />}
                  </div>
                </TableCell>
                <TableCell>{n._count?.mentions ?? 0}</TableCell>
                <TableCell>{new Date(n.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
