'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchWarRoomAlerts, resolveWarRoomAlert } from '@/lib/war-room';
import { useAuth } from '@/lib/auth';

export default function WarRoomAlertsPage() {
  const [page, setPage] = React.useState(1);
  const [resolved, setResolved] = React.useState('false');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('warroom'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['war-room-alerts', page, resolved],
    queryFn: () => fetchWarRoomAlerts({ page, limit: 20, resolved }),
  });

  const resolve = useMutation({
    mutationFn: resolveWarRoomAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['war-room-alerts'] }),
  });

  return (
    <>
      <PageHeader title="War Room Alerts" description="Election issue and campaign alerts." />
      <div className="mb-4 flex gap-2">
        <Button variant={resolved === 'false' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved('false'); setPage(1); }}>Open</Button>
        <Button variant={resolved === 'true' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved('true'); setPage(1); }}>Resolved</Button>
        <Button variant={resolved === '' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved(''); setPage(1); }}>All</Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((a: { id: string; title: string; severity: string; resolved: boolean }) => (
              <TableRow key={a.id}>
                <TableCell>{a.title}</TableCell>
                <TableCell><StatusBadge status={a.severity} /></TableCell>
                <TableCell>{a.resolved ? 'Resolved' : 'Open'}</TableCell>
                <TableCell>{canEdit && !a.resolved && <Button size="sm" onClick={() => resolve.mutate(a.id)}>Resolve</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
