'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { detectVoterDuplicates, fetchVoterDuplicates, reviewVoterDuplicate } from '@/lib/voter-intelligence';
import { useAuth } from '@/lib/auth';

export default function VoterDuplicatesPage() {
  const [page, setPage] = React.useState(1);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('voterintelligence'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['voter-duplicates', page],
    queryFn: () => fetchVoterDuplicates({ page, limit: 20, status: 'Pending' }),
  });

  const detect = useMutation({
    mutationFn: detectVoterDuplicates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voter-duplicates'] }),
  });

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => reviewVoterDuplicate(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voter-duplicates'] }),
  });

  return (
    <>
      <PageHeader
        title="Duplicate Voters"
        description="Review potential duplicate citizen/voter records."
        actions={canEdit ? (
          <Button onClick={() => detect.mutate()} disabled={detect.isPending}>Run detection</Button>
        ) : undefined}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Citizen A</TableHead>
              <TableHead>Citizen B</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((d: {
              id: string;
              matchScore: number;
              matchReason?: string;
              status: string;
              citizenA: { name: string; voterId?: string | null };
              citizenB: { name: string; voterId?: string | null };
            }) => (
              <TableRow key={d.id}>
                <TableCell>{d.citizenA.name} ({d.citizenA.voterId ?? '—'})</TableCell>
                <TableCell>{d.citizenB.name} ({d.citizenB.voterId ?? '—'})</TableCell>
                <TableCell>{d.matchScore}</TableCell>
                <TableCell>{d.matchReason ?? '—'}</TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell>
                <TableCell>
                  {canEdit && d.status === 'Pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => review.mutate({ id: d.id, status: 'Confirmed' })}>Confirm</Button>
                      <Button size="sm" variant="ghost" onClick={() => review.mutate({ id: d.id, status: 'Rejected' })}>Reject</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
