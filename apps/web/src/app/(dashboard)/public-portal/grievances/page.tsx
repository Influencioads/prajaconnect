'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchPublicPortalGrievances } from '@/lib/public-portal';

export default function PublicPortalGrievancesPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['public-portal-grievances', page],
    queryFn: () => fetchPublicPortalGrievances({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Portal Grievances" description="Grievances submitted via the public citizen portal." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((g: { id: string; code: string; title: string; reportedByName?: string; status: string; priority: string }) => (
              <TableRow key={g.id}>
                <TableCell>{g.code}</TableCell>
                <TableCell>{g.title}</TableCell>
                <TableCell>{g.reportedByName ?? '—'}</TableCell>
                <TableCell><StatusBadge status={g.status} /></TableCell>
                <TableCell><StatusBadge status={g.priority} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
