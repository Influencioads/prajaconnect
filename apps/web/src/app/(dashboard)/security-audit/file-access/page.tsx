'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { fetchSecurityFileAccess } from '@/lib/security-audit';

export default function SecurityAuditFileAccessPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['security-audit-file-access', page],
    queryFn: () => fetchSecurityFileAccess({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="File Access Logs" description="Track file views, downloads, and other access events." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Path</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((f: { id: string; filePath: string; action: string; user?: { name: string }; createdAt: string }) => (
              <TableRow key={f.id}>
                <TableCell className="max-w-[280px] truncate">{f.filePath}</TableCell>
                <TableCell className="capitalize">{f.action}</TableCell>
                <TableCell>{f.user?.name ?? '—'}</TableCell>
                <TableCell>{new Date(f.createdAt).toLocaleString()}</TableCell>
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
