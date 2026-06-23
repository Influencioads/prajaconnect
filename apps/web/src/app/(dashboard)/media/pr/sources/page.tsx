'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createNewsSource,
  deleteNewsSource,
  fetchNewsSources,
  testNewsSource,
  updateNewsSource,
} from '@/lib/pr-management';
import { useAuth } from '@/lib/auth';

export default function PrSourcesPage() {
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', url: '', language: 'te' });
  const [testUrl, setTestUrl] = React.useState('');
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pr-sources'],
    queryFn: fetchNewsSources,
  });

  const create = useMutation({
    mutationFn: createNewsSource,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pr-sources'] });
      setShowForm(false);
      setForm({ name: '', url: '', language: 'te' });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateNewsSource(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pr-sources'] }),
  });

  const remove = useMutation({
    mutationFn: deleteNewsSource,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pr-sources'] }),
  });

  const test = useMutation({
    mutationFn: testNewsSource,
    onSuccess: (res) => {
      if (res.ok) {
        setTestResult(`OK — ${res.itemCount} items. Samples: ${res.sampleTitles.join('; ')}`);
      } else {
        setTestResult(`Failed: ${res.error}`);
      }
    },
  });

  return (
    <>
      <PageHeader
        title="News Sources"
        description="Regional RSS feeds ingested every 4 hours by the AI PR cycle."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/media/pr">Command Center</Link></Button>
            {canEdit && <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Source'}</Button>}
          </div>
        }
      />

      {showForm && canEdit && (
        <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>RSS URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
          <div><Label>Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
          <Button disabled={!form.name || !form.url || create.isPending} onClick={() => create.mutate(form)}>Save</Button>
        </div>
      )}

      <div className="mb-4 max-w-lg space-y-2 rounded-lg border p-4">
        <Label>Test RSS URL</Label>
        <div className="flex gap-2">
          <Input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="https://..." />
          <Button variant="outline" disabled={!testUrl || test.isPending} onClick={() => test.mutate(testUrl)}>Test</Button>
        </div>
        {testResult && <p className="text-xs text-muted-foreground">{testResult}</p>}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Fetch</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="max-w-xs truncate text-xs">{s.url}</TableCell>
                <TableCell>
                  <StatusBadge status={s.enabled ? 'Active' : 'Disabled'} />
                  {s.lastError && <p className="mt-1 text-xs text-red-600">{s.lastError}</p>}
                </TableCell>
                <TableCell className="text-sm">
                  {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: s.id, enabled: !s.enabled })}>
                        {s.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove.mutate(s.id)}>Delete</Button>
                    </div>
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
