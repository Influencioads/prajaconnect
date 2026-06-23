'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPublicUpdate, fetchPromise, formatCurrency, updatePromise, PROMISE_WORK_STATUSES } from '@/lib/manifesto';
import { useAuth } from '@/lib/auth';

export default function ManifestoPromiseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = React.useState('');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('manifesto'));
  const qc = useQueryClient();

  const { data: promise, isLoading } = useQuery({
    queryKey: ['manifesto-promise', id],
    queryFn: () => fetchPromise(id),
  });

  const updateStatus = useMutation({
    mutationFn: (workStatus: string) => updatePromise(id, { workStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manifesto-promise', id] }),
  });

  const addUpdate = useMutation({
    mutationFn: () => createPublicUpdate({ promiseId: id, note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manifesto-promise', id] }); setNote(''); },
  });

  if (isLoading || !promise) return <div className="p-6">Loading…</div>;

  return (
    <>
      <PageHeader title={promise.title} description={`${promise.department ?? 'No department'} · ${promise.completionPct}% complete`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Status: <StatusBadge status={promise.workStatus} /></p>
            <p>Category: {promise.category?.name ?? '—'}</p>
            <p>Budget: {formatCurrency(promise.budgetSpent)} / {formatCurrency(promise.budgetTotal)}</p>
            {canEdit && (
              <div className="flex flex-wrap gap-2 pt-2">
                {PROMISE_WORK_STATUSES.map((s) => (
                  <Button key={s} size="sm" variant={promise.workStatus === s ? 'default' : 'outline'} onClick={() => updateStatus.mutate(s)}>{s}</Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Public Updates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(promise.publicUpdates ?? []).map((u) => (
              <div key={u.id} className="rounded-lg border px-3 py-2 text-sm">
                <p>{u.note}</p>
                <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {canEdit && (
              <div className="space-y-2 pt-2">
                <Label>New update</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Public progress note" />
                <Button disabled={!note || addUpdate.isPending} onClick={() => addUpdate.mutate()}>Post Update</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Status Log</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(promise.statusLogs ?? []).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <StatusBadge status={l.status} />
                <span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
