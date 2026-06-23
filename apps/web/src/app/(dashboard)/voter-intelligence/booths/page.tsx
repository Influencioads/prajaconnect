'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { fetchVoterBoothStrength } from '@/lib/voter-intelligence';

export default function VoterBoothsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['voter-booths', page],
    queryFn: () => fetchVoterBoothStrength({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Booth Voter Strength" description="Booth-wise supporter breakdown and priority scores." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booth</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Supporters</TableHead>
              <TableHead>Swing</TableHead>
              <TableHead>Supporter %</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((b: {
              id: string;
              supporterCount: number;
              swingCount: number;
              supporterPct: number;
              strengthLabel: string;
              priorityBoothScore: number;
              booth: { number: string; name?: string | null; village?: { name: string } | null };
            }) => (
              <TableRow key={b.id}>
                <TableCell>Booth {b.booth.number}</TableCell>
                <TableCell>{b.booth.village?.name ?? '—'}</TableCell>
                <TableCell>{b.supporterCount}</TableCell>
                <TableCell>{b.swingCount}</TableCell>
                <TableCell>{b.supporterPct.toFixed(1)}%</TableCell>
                <TableCell><StatusBadge status={b.strengthLabel} /></TableCell>
                <TableCell>{b.priorityBoothScore}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
