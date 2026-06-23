'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { fetchWarRoomReadinessBooths, fetchWarRoomReadinessMandals } from '@/lib/war-room';

export default function WarRoomReadinessPage() {
  const [page, setPage] = React.useState(1);
  const booths = useQuery({ queryKey: ['war-room-booths', page], queryFn: () => fetchWarRoomReadinessBooths({ page, limit: 20 }) });
  const mandals = useQuery({ queryKey: ['war-room-mandals'], queryFn: () => fetchWarRoomReadinessMandals({ page: 1, limit: 50 }) });

  return (
    <>
      <PageHeader title="Booth & Mandal Readiness" description="Readiness scores for campaign operations." />
      <h2 className="mb-2 font-semibold text-navy">Booth Readiness</h2>
      <div className="rounded-lg border mb-6">
        <Table>
          <TableHeader><TableRow><TableHead>Booth</TableHead><TableHead>Village</TableHead><TableHead>Score</TableHead></TableRow></TableHeader>
          <TableBody>
            {(booths.data?.data ?? []).map((b: { id: string; score: number; booth: { number: string; village?: { name: string } } }) => (
              <TableRow key={b.id}><TableCell>Booth {b.booth.number}</TableCell><TableCell>{b.booth.village?.name ?? '—'}</TableCell><TableCell>{b.score}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {booths.data?.meta && <Pagination page={booths.data.meta.page} totalPages={booths.data.meta.totalPages} onChange={setPage} />}
      <h2 className="mb-2 mt-6 font-semibold text-navy">Mandal Readiness</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Mandal</TableHead><TableHead>Score</TableHead></TableRow></TableHeader>
          <TableBody>
            {(mandals.data?.data ?? []).map((m: { id: string; score: number; mandal: { name: string } }) => (
              <TableRow key={m.id}><TableCell>{m.mandal.name}</TableCell><TableCell>{m.score}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
