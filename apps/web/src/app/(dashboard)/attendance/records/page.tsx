'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { fetchAttendanceRecords, fetchAttendanceRecord } from '@/lib/attendance';

export default function AttendanceRecordsPage() {
  const [page, setPage] = React.useState(1);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-records', page],
    queryFn: () => fetchAttendanceRecords({ page, limit: 20 }),
  });

  const detail = useQuery({
    queryKey: ['attendance-record', selectedId],
    queryFn: () => fetchAttendanceRecord(selectedId!),
    enabled: !!selectedId,
  });

  return (
    <>
      <PageHeader title="Attendance Records" description="Volunteer check-in and check-out history." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cadre</TableHead>
              <TableHead>Mandal</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Geo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((r: {
              id: string;
              checkInAt: string;
              checkOutAt?: string | null;
              geoVerified: boolean;
              cadre: { name: string; mandal?: { name: string } };
            }) => (
              <TableRow key={r.id}>
                <TableCell>{r.cadre.name}</TableCell>
                <TableCell>{r.cadre.mandal?.name ?? '—'}</TableCell>
                <TableCell>{new Date(r.checkInAt).toLocaleString()}</TableCell>
                <TableCell>{r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : 'Active'}</TableCell>
                <TableCell><StatusBadge status={r.geoVerified ? 'Verified' : 'Unverified'} /></TableCell>
                <TableCell>
                  <Button variant="link" size="sm" asChild>
                    <Link href={`/attendance/records?id=${r.id}`}>Details</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
      {selectedId && detail.data && (
        <div className="mt-6 rounded-lg border p-4">
          <h3 className="font-semibold text-navy">Record Detail</h3>
          <p className="mt-2 text-sm"><strong>Cadre:</strong> {detail.data.cadre.name} ({detail.data.cadre.designation})</p>
          <p className="text-sm"><strong>Check-in:</strong> {new Date(detail.data.checkInAt).toLocaleString()}</p>
          <p className="text-sm"><strong>Check-out:</strong> {detail.data.checkOutAt ? new Date(detail.data.checkOutAt).toLocaleString() : 'Still active'}</p>
          <p className="text-sm"><strong>Location:</strong> {detail.data.latitude ?? '—'}, {detail.data.longitude ?? '—'}</p>
          <p className="text-sm"><strong>Geo verified:</strong> {detail.data.geoVerified ? 'Yes' : 'No'}</p>
          {detail.data.notes && <p className="text-sm"><strong>Notes:</strong> {detail.data.notes}</p>}
        </div>
      )}
    </>
  );
}
