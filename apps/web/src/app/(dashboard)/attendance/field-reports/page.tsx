'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { fetchFieldReports, downloadAttendanceReport } from '@/lib/attendance';

export default function FieldReportsPage() {
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-field-reports', page],
    queryFn: () => fetchFieldReports({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader
        title="Daily Field Reports"
        description="Volunteer end-of-day activity summaries."
        actions={<Button variant="gold" onClick={() => downloadAttendanceReport('field-reports')}>Export CSV</Button>}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cadre</TableHead>
              <TableHead>Report Date</TableHead>
              <TableHead>Tasks Completed</TableHead>
              <TableHead>Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((r: {
              id: string;
              reportDate: string;
              tasksCompleted: number;
              summary: string;
              cadre: { name: string };
            }) => (
              <TableRow key={r.id}>
                <TableCell>{r.cadre.name}</TableCell>
                <TableCell>{new Date(r.reportDate).toLocaleDateString()}</TableCell>
                <TableCell>{r.tasksCompleted}</TableCell>
                <TableCell className="max-w-md truncate">{r.summary}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
