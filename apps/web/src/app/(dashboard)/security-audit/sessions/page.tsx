'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { fetchSecuritySessions, revokeSecuritySession } from '@/lib/security-audit';
import { useAuth } from '@/lib/auth';

export default function SecurityAuditSessionsPage() {
  const [page, setPage] = React.useState(1);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('securityaudit'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['security-audit-sessions', page],
    queryFn: () => fetchSecuritySessions({ page, limit: 20 }),
  });

  const revoke = useMutation({
    mutationFn: revokeSecuritySession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security-audit-sessions'] });
      qc.invalidateQueries({ queryKey: ['security-audit-dashboard'] });
    },
  });

  return (
    <>
      <PageHeader title="Active Sessions" description="Review and revoke user sessions." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((s: { id: string; createdAt: string; expiresAt: string; user?: { name: string; email: string } }) => (
              <TableRow key={s.id}>
                <TableCell>{s.user?.name ?? '—'}</TableCell>
                <TableCell>{s.user?.email ?? '—'}</TableCell>
                <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                <TableCell>{new Date(s.expiresAt).toLocaleString()}</TableCell>
                <TableCell>
                  {canEdit && (
                    <Button size="sm" variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                      Revoke
                    </Button>
                  )}
                </TableCell>
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
