'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchWarRoomEscalations, updateWarRoomEscalation } from '@/lib/war-room';
import { useAuth } from '@/lib/auth';

export default function WarRoomEscalationsPage() {
  const [page, setPage] = React.useState(1);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('warroom'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['war-room-escalations', page],
    queryFn: () => fetchWarRoomEscalations({ page, limit: 20 }),
  });

  const close = useMutation({
    mutationFn: (id: string) => updateWarRoomEscalation(id, { status: 'Resolved' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['war-room-escalations'] }),
  });

  return (
    <>
      <PageHeader title="Election Escalations" description="Critical issue escalation board." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((e: { id: string; title: string; status: string; priority: string; assignedTo?: { name: string } }) => (
              <TableRow key={e.id}>
                <TableCell>{e.title}</TableCell>
                <TableCell><StatusBadge status={e.status} /></TableCell>
                <TableCell><StatusBadge status={e.priority} /></TableCell>
                <TableCell>{e.assignedTo?.name ?? '—'}</TableCell>
                <TableCell>{canEdit && e.status !== 'Resolved' && <Button size="sm" onClick={() => close.mutate(e.id)}>Resolve</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
