'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  createJobSource,
  daysLeft,
  deleteJobSource,
  fetchJobPostings,
  fetchJobSources,
  runJobsCycle,
  testJobSource,
  updateJobSource,
} from '@/lib/jobs';
import { useAuth } from '@/lib/auth';

const STATUSES = ['New', 'Reviewed', 'Dispatched', 'Expired'];

export default function JobsPage() {
  const [status, setStatus] = React.useState<string>('all');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', url: '' });
  const [testUrl, setTestUrl] = React.useState('');
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [runResult, setRunResult] = React.useState<string | null>(null);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('jobs'));
  const qc = useQueryClient();

  const { data: postings, isLoading } = useQuery({
    queryKey: ['job-postings', status],
    queryFn: () => fetchJobPostings({ status: status === 'all' ? undefined : status, limit: 50 }),
  });

  const { data: sources } = useQuery({ queryKey: ['job-sources'], queryFn: fetchJobSources });

  const run = useMutation({
    mutationFn: runJobsCycle,
    onSuccess: (res) => {
      setRunResult(`Run ${res.status}: ${res.postingsNew} new postings from ${res.sourcesChecked} sources.`);
      qc.invalidateQueries({ queryKey: ['job-postings'] });
      qc.invalidateQueries({ queryKey: ['job-sources'] });
    },
  });

  const create = useMutation({
    mutationFn: createJobSource,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-sources'] });
      setShowForm(false);
      setForm({ name: '', url: '' });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateJobSource(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-sources'] }),
  });

  const remove = useMutation({
    mutationFn: deleteJobSource,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-sources'] }),
  });

  const test = useMutation({
    mutationFn: testJobSource,
    onSuccess: (res) => {
      setTestResult(res.ok ? `OK — ${res.itemCount} items. Samples: ${res.sampleTitles.join('; ')}` : `Failed: ${res.error}`);
    },
  });

  return (
    <>
      <PageHeader
        title="Government Jobs"
        description="Job notifications ingested every 6 hours and dispatched to matching youth."
        actions={
          canEdit && (
            <Button disabled={run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? 'Running…' : 'Run Now'}
            </Button>
          )
        }
      />
      {runResult && <p className="mb-4 text-xs text-muted-foreground">{runResult}</p>}

      <Tabs defaultValue="postings">
        <TabsList>
          <TabsTrigger value="postings">Postings</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="postings">
          <div className="mb-4 flex items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Last Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
                ) : (postings?.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-muted-foreground">No postings yet. Add a source and run the cycle.</TableCell></TableRow>
                ) : (postings?.data ?? []).map((p) => {
                  const countdown = daysLeft(p.lastDate);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-md font-medium">
                        <Link href={`/jobs/${p.id}`} className="hover:underline">{p.title}</Link>
                      </TableCell>
                      <TableCell className="text-sm">{p.organization ?? '—'}</TableCell>
                      <TableCell className="text-sm">{p.qualification ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {p.lastDate ? (
                          <span className={countdown?.expired ? 'text-red-600' : ''}>
                            {new Date(p.lastDate).toLocaleDateString()}
                            {countdown && <span className="ml-1 text-xs">({countdown.label})</span>}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sources">
          {canEdit && (
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Source'}</Button>
            </div>
          )}

          {showForm && canEdit && (
            <div className="mb-4 max-w-md space-y-3 rounded-lg border p-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>RSS URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
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
                {(sources ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">{s.url}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.active ? 'Active' : 'Disabled'} />
                      {s.lastError && <p className="mt-1 text-xs text-red-600">{s.lastError}</p>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.lastFetchAt ? new Date(s.lastFetchAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: s.id, active: !s.active })}>
                            {s.active ? 'Disable' : 'Enable'}
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
        </TabsContent>
      </Tabs>
    </>
  );
}
