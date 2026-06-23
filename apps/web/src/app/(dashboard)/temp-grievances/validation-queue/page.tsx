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

export default function ValidationQueuePage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['temp-grievances-queue', page],
    queryFn: () => fetchTempGrievances({ page, limit: 20, status: 'PendingValidation' }),
  });

  return (
    <>
      <PageHeader title="Validation Queue" description="Temp grievances awaiting human validation." />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Spinner className="mx-auto" /> : !data?.data.length ? (
            <EmptyState title="Queue empty" description="No items pending validation." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temp ID</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Citizen</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Validator</TableHead>
                    <TableHead>Validation due</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Link href={`/temp-grievances/${item.id}`} className="font-medium text-primary hover:underline">{item.tempTicketId}</Link></TableCell>
                      <TableCell>{item.source}</TableCell>
                      <TableCell>{item.citizenName ?? '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.issueSummary ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={item.priority} /></TableCell>
                      <TableCell>{item.assignedValidator?.name ?? 'Unassigned'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.validationDueAt ? formatDate(item.validationDueAt) : '—'}
                      </TableCell>
                      <TableCell>
                        {item.slaStatus === 'Breached' ? (
                          <span className="text-xs font-semibold text-red-600">{item.daysOverdue ?? 0}d overdue</span>
                        ) : item.slaStatus === 'DueSoon' ? (
                          <span className="text-xs font-medium text-amber-600">{item.daysRemaining ?? 0}d left</span>
                        ) : item.validationDueAt ? (
                          <span className="text-xs text-muted-foreground">{item.daysRemaining ?? 0}d left</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
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
