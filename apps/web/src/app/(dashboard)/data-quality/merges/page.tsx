'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { executeMergeSuggestion, fetchMergeSuggestions, reviewMergeSuggestion } from '@/lib/data-quality';
import { useAuth } from '@/lib/auth';

export default function DataQualityMergesPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('Pending');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('dataquality'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['merge-suggestions', page, status],
    queryFn: () => fetchMergeSuggestions({ page, limit: 20, status }),
  });

  const review = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => reviewMergeSuggestion(id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merge-suggestions'] }),
  });

  const execute = useMutation({
    mutationFn: executeMergeSuggestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merge-suggestions'] }),
  });

  return (
    <>
      <PageHeader title="Profile Merge Suggestions" description="Review and execute citizen profile merges." />
      <div className="mb-4 flex gap-2">
        {['Pending', 'Approved', 'Rejected'].map((s) => (
          <Button key={s} variant={status === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(s); setPage(1); }}>{s}</Button>
        ))}
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Citizen A</TableHead><TableHead>Citizen B</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((m: { id: string; score: number; status: string; citizenA?: { name: string }; citizenB?: { name: string } }) => (
              <TableRow key={m.id}>
                <TableCell>{m.citizenA?.name ?? '—'}</TableCell>
                <TableCell>{m.citizenB?.name ?? '—'}</TableCell>
                <TableCell>{Math.round(m.score * 100)}%</TableCell>
                <TableCell>{m.status}</TableCell>
                <TableCell className="space-x-2">
                  {canEdit && m.status === 'Pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => review.mutate({ id: m.id, s: 'Approved' })}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => review.mutate({ id: m.id, s: 'Rejected' })}>Reject</Button>
                      <Button size="sm" onClick={() => execute.mutate(m.id)}>Execute merge</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPage={setPage} />}
    </>
  );
}
