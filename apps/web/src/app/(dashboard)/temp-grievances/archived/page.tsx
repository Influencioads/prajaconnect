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

export default function ArchivedTempGrievancesPage() {
  const [page, setPage] = React.useState(1);
  const [tab, setTab] = React.useState<'Rejected' | 'Archived'>('Rejected');

  const { data, isLoading } = useQuery({
    queryKey: ['temp-grievances-archived', page, tab],
    queryFn: () => fetchTempGrievances({ page, limit: 20, status: tab }),
  });

  return (
    <>
      <PageHeader title="Rejected / Archived" description="Closed temp grievances that were not converted." />
      <div className="mb-4 flex gap-2">
        {(['Rejected', 'Archived'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-navy text-white' : 'bg-muted'}`}>{t}</button>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Spinner className="mx-auto" /> : !data?.data.length ? (
            <EmptyState title={`No ${tab.toLowerCase()} records`} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temp ID</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Citizen</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
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
