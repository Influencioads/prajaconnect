'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchEmergencyResponses } from '@/lib/crisis';

export default function CrisisRrtPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['crisis-rrt', page],
    queryFn: () => fetchEmergencyResponses({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Rapid Response Teams" description="Emergency response teams and cadre assignments." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.teamName}</TableCell>
                <TableCell>{r.issue?.title ?? '—'}</TableCell>
                <TableCell>{r.issue?.severity ? <StatusBadge status={r.issue.severity} /> : '—'}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>{r._count?.assignments ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
