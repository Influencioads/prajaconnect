'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchSecurityLoginHistory } from '@/lib/security-audit';

export default function SecurityAuditLoginsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['security-audit-logins', page],
    queryFn: () => fetchSecurityLoginHistory({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Login History" description="Successful and failed login attempts across the platform." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((l: { id: string; success: boolean; ip?: string; user?: { name: string; email: string }; createdAt: string }) => (
              <TableRow key={l.id}>
                <TableCell>{l.user?.name ?? '—'}</TableCell>
                <TableCell>{l.user?.email ?? '—'}</TableCell>
                <TableCell>{l.ip ?? '—'}</TableCell>
                <TableCell><StatusBadge status={l.success ? 'Success' : 'Failed'} /></TableCell>
                <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
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
