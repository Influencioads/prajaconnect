'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { fetchLeaderNotes } from '@/lib/leader-office';

export default function LeaderNotesPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['leader-notes', page],
    queryFn: () => fetchLeaderNotes({ page, limit: 20 }),
  });

  return (
    <>
      <PageHeader title="Meeting Notes" description="Notes from meetings and briefings." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Meeting Date</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((n: { id: string; title: string; meetingDate: string; content: string }) => (
              <TableRow key={n.id}>
                <TableCell>{n.title}</TableCell>
                <TableCell>{new Date(n.meetingDate).toLocaleDateString()}</TableCell>
                <TableCell className="max-w-md truncate">{n.content}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
