'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  fetchAttendanceCorrections,
  approveAttendanceCorrection,
  rejectAttendanceCorrection,
} from '@/lib/attendance';
import { useAuth } from '@/lib/auth';

export default function AttendanceCorrectionsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('Pending');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('attendance'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-corrections', page, status],
    queryFn: () => fetchAttendanceCorrections({ page, limit: 20, status: status || undefined }),
  });

  const approve = useMutation({
    mutationFn: approveAttendanceCorrection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-corrections'] }),
  });

  const reject = useMutation({
    mutationFn: rejectAttendanceCorrection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-corrections'] }),
  });

  return (
    <>
      <PageHeader title="Attendance Corrections" description="Review and approve correction requests from field volunteers." />
      <div className="mb-4 flex gap-2">
        {['Pending', 'Approved', 'Rejected', ''].map((s) => (
          <Button
            key={s || 'all'}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s || 'All'}
          </Button>
        ))}
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cadre</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((c: {
              id: string;
              reason: string;
              status: string;
              createdAt: string;
              attendance: { cadre: { name: string } };
            }) => (
              <TableRow key={c.id}>
                <TableCell>{c.attendance.cadre.name}</TableCell>
                <TableCell className="max-w-xs truncate">{c.reason}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {canEdit && c.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve.mutate(c.id)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => reject.mutate(c.id)}>Reject</Button>
                    </div>
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
