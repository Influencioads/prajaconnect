'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { fetchLeaderVisitors, downloadLeaderVisitorsExport } from '@/lib/leader-office';

export default function LeaderVisitorsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['leader-visitors', page],
    queryFn: () => fetchLeaderVisitors({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader
        title="Visitors"
        description="Office visitor check-in and check-out log."
        actions={<Button variant="outline" size="sm" onClick={() => downloadLeaderVisitorsExport()}>Export CSV</Button>}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((v: { id: string; name: string; mobile?: string; purpose?: string; checkInAt: string; checkOutAt?: string }) => (
              <TableRow key={v.id}>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.mobile ?? '—'}</TableCell>
                <TableCell>{v.purpose ?? '—'}</TableCell>
                <TableCell>{new Date(v.checkInAt).toLocaleString()}</TableCell>
                <TableCell>{v.checkOutAt ? new Date(v.checkOutAt).toLocaleString() : 'Active'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
