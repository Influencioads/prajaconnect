'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { fetchSecurityExportLogs } from '@/lib/security-audit';

export default function SecurityAuditExportsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['security-audit-exports', page],
    queryFn: () => fetchSecurityExportLogs({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Export Logs" description="Audit trail of data exports from the platform." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Export Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((e: { id: string; exportType: string; user?: { name: string; email: string }; createdAt: string }) => (
              <TableRow key={e.id}>
                <TableCell>{e.exportType}</TableCell>
                <TableCell>{e.user?.name ?? 'System'}</TableCell>
                <TableCell>{e.user?.email ?? '—'}</TableCell>
                <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
      )}
    </>
  );
}
