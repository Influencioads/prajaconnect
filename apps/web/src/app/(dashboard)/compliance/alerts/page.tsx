'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchComplianceAlerts, resolveComplianceAlert } from '@/lib/compliance';
import { useAuth } from '@/lib/auth';

export default function ComplianceAlertsPage() {
  const [page, setPage] = React.useState(1);
  const [resolved, setResolved] = React.useState('false');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('compliance'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-alerts', page, resolved],
    queryFn: () => fetchComplianceAlerts({ page, limit: 20, resolved }),
  });

  const resolve = useMutation({
    mutationFn: resolveComplianceAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance-alerts'] }),
  });

  return (
    <>
      <PageHeader title="Compliance Alerts" description="Permission expiry, missing documents, and regulatory warnings." />
      <div className="mb-4 flex gap-2">
        <Button variant={resolved === 'false' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved('false'); setPage(1); }}>Open</Button>
        <Button variant={resolved === 'true' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved('true'); setPage(1); }}>Resolved</Button>
        <Button variant={resolved === '' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved(''); setPage(1); }}>All</Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Message</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.message}</TableCell>
                <TableCell><StatusBadge status={a.severity} /></TableCell>
                <TableCell>{a.resolved ? 'Resolved' : 'Open'}</TableCell>
                <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{canEdit && !a.resolved && <Button size="sm" onClick={() => resolve.mutate(a.id)}>Resolve</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
