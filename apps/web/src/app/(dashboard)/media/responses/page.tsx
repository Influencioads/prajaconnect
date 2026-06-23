'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { approveMediaResponse, fetchMediaResponses, publishMediaResponse } from '@/lib/media';
import { useAuth } from '@/lib/auth';

export default function MediaResponsesPage() {
  const [page, setPage] = React.useState(1);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media-responses', page],
    queryFn: () => fetchMediaResponses({ page, limit: 20 }),
  });

  const approve = useMutation({
    mutationFn: approveMediaResponse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-responses'] }),
  });

  const publish = useMutation({
    mutationFn: publishMediaResponse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-responses'] }),
  });

  return (
    <>
      <PageHeader title="Media Responses" description="Draft, approve, and publish counter-narratives." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attack</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.attack?.title ?? '—'}</TableCell>
                <TableCell className="max-w-xs truncate">{r.content}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex gap-1">
                      {['Draft', 'PendingApproval'].includes(r.status) && (
                        <Button size="sm" variant="outline" onClick={() => approve.mutate(r.id)}>Approve</Button>
                      )}
                      {r.status === 'Approved' && (
                        <Button size="sm" variant="outline" onClick={() => publish.mutate(r.id)}>Publish</Button>
                      )}
                    </div>
                  )}
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
