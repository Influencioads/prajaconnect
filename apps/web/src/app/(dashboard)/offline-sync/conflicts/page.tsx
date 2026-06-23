'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { fetchOfflineSyncConflicts, resolveOfflineConflict } from '@/lib/offline-sync';
import { useAuth } from '@/lib/auth';

export default function OfflineSyncConflictsPage() {
  const [page, setPage] = React.useState(1);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('offlinesync'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['offline-sync-conflicts', page],
    queryFn: () => fetchOfflineSyncConflicts({ page, limit: 20 }),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: 'server' | 'client' }) =>
      resolveOfflineConflict(id, resolution),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offline-sync-conflicts'] });
      qc.invalidateQueries({ queryKey: ['offline-sync-pending'] });
      qc.invalidateQueries({ queryKey: ['offline-sync-dashboard'] });
    },
  });

  return (
    <>
      <PageHeader title="Sync Conflicts" description="Resolve conflicts between server and offline field data." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Queue Error</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((c: { id: string; createdAt: string; queue?: { deviceId: string; entityType: string; error?: string; payload?: Record<string, unknown> } }) => (
              <TableRow key={c.id}>
                <TableCell>{c.queue?.deviceId ?? '—'}</TableCell>
                <TableCell>{c.queue?.entityType ?? '—'}</TableCell>
                <TableCell className="max-w-[240px] truncate">{c.queue?.error ?? 'Conflict detected'}</TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
                <TableCell className="space-x-2">
                  {canEdit && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resolve.isPending}
                        onClick={() => resolve.mutate({ id: c.id, resolution: 'server' })}
                      >
                        Keep server
                      </Button>
                      <Button
                        size="sm"
                        disabled={resolve.isPending}
                        onClick={() => resolve.mutate({ id: c.id, resolution: 'client' })}
                      >
                        Use offline
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !(data?.data ?? []).length && (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">No unresolved conflicts</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data?.meta && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
      )}
    </>
  );
}
