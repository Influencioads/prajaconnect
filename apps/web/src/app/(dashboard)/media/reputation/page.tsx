'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { computeReputationScore, fetchReputationSnapshots } from '@/lib/media';
import { useAuth } from '@/lib/auth';

export default function MediaReputationPage() {
  const [page, setPage] = React.useState(1);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media-reputation', page],
    queryFn: () => fetchReputationSnapshots({ page, limit: 20 }),
  });

  const compute = useMutation({
    mutationFn: computeReputationScore,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-reputation'] }),
  });

  return (
    <>
      <PageHeader
        title="Reputation Score"
        description="Historical reputation snapshots computed from news sentiment and attack volume."
        actions={canEdit ? <Button onClick={() => compute.mutate()} disabled={compute.isPending}>Compute Score</Button> : undefined}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Score</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={2}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-lg font-semibold">{Math.round(s.score)}</TableCell>
                <TableCell>{new Date(s.date).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
