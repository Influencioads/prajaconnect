'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { approvePublicVolunteer, fetchPublicPortalVolunteers, rejectPublicVolunteer } from '@/lib/public-portal';
import { useAuth } from '@/lib/auth';

export default function PublicPortalVolunteersPage() {
  const [page, setPage] = React.useState(1);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('publicportal'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['public-portal-volunteers', page],
    queryFn: () => fetchPublicPortalVolunteers({ page, limit: 20 }),
  });

  const approve = useMutation({
    mutationFn: approvePublicVolunteer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-portal-volunteers'] }),
  });

  const reject = useMutation({
    mutationFn: rejectPublicVolunteer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-portal-volunteers'] }),
  });

  return (
    <>
      <PageHeader title="Volunteer Registrations" description="Review and approve public volunteer sign-ups." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((v: { id: string; name: string; mobile: string; village?: string; status: string }) => (
              <TableRow key={v.id}>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.mobile}</TableCell>
                <TableCell>{v.village ?? '—'}</TableCell>
                <TableCell><StatusBadge status={v.status} /></TableCell>
                <TableCell className="space-x-2">
                  {canEdit && v.status === 'Pending' && (
                    <>
                      <Button size="sm" onClick={() => approve.mutate(v.id)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => reject.mutate(v.id)}>Reject</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
