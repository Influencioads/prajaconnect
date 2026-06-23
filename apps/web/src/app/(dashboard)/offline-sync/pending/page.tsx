'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchOfflineSyncDashboard, fetchOfflineSyncPending, retryOfflineSyncItem } from '@/lib/offline-sync';
import { useAuth } from '@/lib/auth';

export default function OfflineSyncPendingPage() {
  const [page, setPage] = React.useState(1);
  const [deviceId, setDeviceId] = React.useState('');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('offlinesync'));
  const qc = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ['offline-sync-dashboard'],
    queryFn: fetchOfflineSyncDashboard,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['offline-sync-pending', page, deviceId],
    queryFn: () => fetchOfflineSyncPending({ page, limit: 20, deviceId: deviceId || undefined }),
  });

  const retry = useMutation({
    mutationFn: retryOfflineSyncItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offline-sync-pending'] });
      qc.invalidateQueries({ queryKey: ['offline-sync-dashboard'] });
    },
  });

  const devices = dashboard?.byDevice ?? [];

  return (
    <>
      <PageHeader title="Pending Sync Queue" description="Items waiting to sync from field devices." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={deviceId === '' ? 'default' : 'outline'} size="sm" onClick={() => { setDeviceId(''); setPage(1); }}>All devices</Button>
        {devices.map((d: { deviceId: string; _count: { _all: number } }) => (
          <Button
            key={d.deviceId}
            variant={deviceId === d.deviceId ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setDeviceId(d.deviceId); setPage(1); }}
          >
            {d.deviceId} ({d._count._all})
          </Button>
        ))}
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Queued</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((q: { id: string; deviceId: string; entityType: string; status: string; error?: string; createdAt: string }) => (
              <TableRow key={q.id}>
                <TableCell>{q.deviceId}</TableCell>
                <TableCell>{q.entityType}</TableCell>
                <TableCell><StatusBadge status={q.status} /></TableCell>
                <TableCell className="max-w-[200px] truncate">{q.error ?? '—'}</TableCell>
                <TableCell>{new Date(q.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {canEdit && q.status === 'Failed' && (
                    <Button size="sm" variant="outline" disabled={retry.isPending} onClick={() => retry.mutate(q.id)}>
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
      )}
    </>
  );
}
