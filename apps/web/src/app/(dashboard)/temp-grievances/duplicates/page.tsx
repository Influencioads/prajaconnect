'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';
import { fetchTempGrievances } from '@/lib/crm';

export default function DuplicateReviewPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['temp-grievances-duplicates', page],
    queryFn: () => fetchTempGrievances({ page, limit: 20, duplicateRisk: 'High' }),
  });

  return (
    <>
      <PageHeader title="Duplicate Review" description="Temp grievances with high duplicate risk scores." />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Spinner className="mx-auto" /> : !data?.data.length ? (
            <EmptyState title="No high-risk duplicates" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temp ID</TableHead>
                    <TableHead>Citizen</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Link href={`/temp-grievances/${item.id}`} className="font-medium text-primary hover:underline">{item.tempTicketId}</Link></TableCell>
                      <TableCell>{item.citizenName ?? '—'} · {item.mobileNumber ?? ''}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.issueSummary ?? '—'}</TableCell>
                      <TableCell>{item.duplicateRiskScore}% ({item.duplicateRisk})</TableCell>
                      <TableCell><StatusBadge status={item.validationStatus} /></TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
