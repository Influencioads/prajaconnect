'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { fetchPrReports } from '@/lib/pr-management';

export default function PrReportsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['pr-reports', page],
    queryFn: () => fetchPrReports({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader
        title="PR Reports"
        description="4-hour AI-generated political news digests."
        actions={<Button variant="outline" asChild><Link href="/media/pr">Command Center</Link></Button>}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(r.periodStart).toLocaleString()} — {new Date(r.periodEnd).toLocaleString()}
                </TableCell>
                <TableCell className="max-w-md truncate text-sm">{r.summary ?? '—'}</TableCell>
                <TableCell className="text-sm">{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild><Link href={`/media/pr/reports/${r.id}`}>View</Link></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
