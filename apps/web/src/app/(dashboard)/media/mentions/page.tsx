'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchMentions } from '@/lib/media';

export default function MediaMentionsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['media-mentions', page],
    queryFn: () => fetchMentions({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Leader Mentions" description="Track leader mentions across news articles." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leader</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Sentiment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.leaderName}</TableCell>
                <TableCell>{m.article?.title ?? '—'}</TableCell>
                <TableCell>{m.article?.source ?? '—'}</TableCell>
                <TableCell>{m.sentiment ? <StatusBadge status={m.sentiment} /> : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
