'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchCrisisEscalations } from '@/lib/crisis';

export default function CrisisEscalationsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['crisis-escalations', page],
    queryFn: () => fetchCrisisEscalations({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Crisis Escalations" description="Escalated issues assigned to leadership." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.issue?.title ?? '—'}</TableCell>
                <TableCell>{e.issue?.severity ? <StatusBadge status={e.issue.severity} /> : '—'}</TableCell>
                <TableCell>L{e.level}</TableCell>
                <TableCell>{e.assignedTo?.name ?? 'Unassigned'}</TableCell>
                <TableCell>{new Date(e.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
