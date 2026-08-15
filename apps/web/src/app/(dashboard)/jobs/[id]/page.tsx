'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  daysLeft,
  dispatchJob,
  fetchJobMatches,
  fetchJobPosting,
  updateJobPostingStatus,
} from '@/lib/jobs';
import { useAuth } from '@/lib/auth';

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('jobs'));
  const [channels, setChannels] = React.useState<string[]>(['sms']);
  const [dispatchResult, setDispatchResult] = React.useState<string | null>(null);

  const { data: posting, isLoading } = useQuery({
    queryKey: ['job-posting', id],
    queryFn: () => fetchJobPosting(id),
    enabled: !!id,
  });

  const { data: matches } = useQuery({
    queryKey: ['job-matches', id],
    queryFn: () => fetchJobMatches(id),
    enabled: !!id,
  });

  const dispatch = useMutation({
    mutationFn: () => dispatchJob(id, channels),
    onSuccess: (res) => {
      setDispatchResult(`Dispatched to ${res.citizenCount} citizens via ${res.channels.join(', ') || 'log only'}.`);
      qc.invalidateQueries({ queryKey: ['job-posting', id] });
      qc.invalidateQueries({ queryKey: ['job-postings'] });
    },
  });

  const markReviewed = useMutation({
    mutationFn: () => updateJobPostingStatus(id, 'Reviewed'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-posting', id] });
      qc.invalidateQueries({ queryKey: ['job-postings'] });
    },
  });

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading posting…</p>;
  if (!posting) return <p className="p-6 text-sm text-muted-foreground">Posting not found.</p>;

  const countdown = daysLeft(posting.lastDate);

  return (
    <>
      <PageHeader
        title={posting.title}
        description={posting.organization ?? posting.source?.name ?? ''}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/jobs">Back to Jobs</Link></Button>
            {canEdit && posting.status === 'New' && (
              <Button variant="outline" disabled={markReviewed.isPending} onClick={() => markReviewed.mutate()}>
                Mark Reviewed
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Posting Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={posting.status} />
              {!posting.aiExtracted && <span className="text-xs text-muted-foreground">raw (no AI extraction)</span>}
            </div>
            {posting.summary && <p>{posting.summary}</p>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              <dt className="text-muted-foreground">Qualification</dt><dd>{posting.qualification ?? '—'}</dd>
              <dt className="text-muted-foreground">Age range</dt>
              <dd>{posting.minAge ?? '—'} – {posting.maxAge ?? '—'}</dd>
              <dt className="text-muted-foreground">District</dt><dd>{posting.district ?? '—'}</dd>
              <dt className="text-muted-foreground">Last date</dt>
              <dd className={countdown?.expired ? 'text-red-600' : ''}>
                {posting.lastDate ? `${new Date(posting.lastDate).toLocaleDateString()} (${countdown?.label})` : '—'}
              </dd>
              <dt className="text-muted-foreground">Source</dt><dd>{posting.source?.name ?? '—'}</dd>
            </dl>
            {posting.url && (
              <a href={posting.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                Open original notification
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Matching Citizens {matches ? `(${matches.count})` : ''}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {canEdit && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-4 text-sm">
                  {['sms', 'whatsapp'].map((c) => (
                    <label key={c} className="flex items-center gap-1.5">
                      <input type="checkbox" checked={channels.includes(c)} onChange={() => toggleChannel(c)} />
                      {c.toUpperCase()}
                    </label>
                  ))}
                </div>
                <Button
                  disabled={dispatch.isPending || !matches || matches.withMobile === 0}
                  onClick={() => dispatch.mutate()}
                >
                  {dispatch.isPending
                    ? 'Dispatching…'
                    : `Dispatch to ${matches?.withMobile ?? 0} citizens with mobile`}
                </Button>
                {dispatchResult && <p className="text-xs text-muted-foreground">{dispatchResult}</p>}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Occupation</TableHead>
                  <TableHead>Village</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(matches?.preview ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-muted-foreground">No matching citizens.</TableCell></TableRow>
                ) : (matches?.preview ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.age ?? '—'}</TableCell>
                    <TableCell>{c.occupation ?? '—'}</TableCell>
                    <TableCell>{c.village?.name ?? c.mandal?.name ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(posting.dispatchLogs ?? []).length > 0 && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Dispatch History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Citizens</TableHead>
                  <TableHead>Channels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(posting.dispatchLogs ?? []).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{l.citizenCount}</TableCell>
                    <TableCell>{Array.isArray(l.channels) ? l.channels.join(', ') : String(l.channels)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
