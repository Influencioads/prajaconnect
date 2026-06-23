'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { acknowledgePrAlert, fetchPrAlerts, resolvePrAlert } from '@/lib/pr-management';
import { useAuth } from '@/lib/auth';

const TYPES = ['', 'NegativePR', 'TimelineViolation', 'SeriousConcern', 'ReputationDrop'];
const SEVERITIES = ['', 'Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['', 'Open', 'Acknowledged', 'Resolved'];

export default function PrAlertsPage() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [page, setPage] = React.useState(1);
  const [type, setType] = React.useState(searchParams.get('type') ?? '');
  const [severity, setSeverity] = React.useState(searchParams.get('severity') ?? '');
  const [status, setStatus] = React.useState('Open');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('media'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pr-alerts', page, type, severity, status],
    queryFn: () => fetchPrAlerts({ page, limit: 20, type: type || undefined, severity: severity || undefined, status: status || undefined }),
  });

  const ack = useMutation({
    mutationFn: acknowledgePrAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pr-alerts'] }),
  });

  const resolve = useMutation({
    mutationFn: resolvePrAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pr-alerts'] }),
  });

  return (
    <>
      <PageHeader
        title="PR Alerts"
        description="Critical alerts, timeline violations, and negative PR escalations."
        actions={<Button variant="outline" asChild><Link href="/media/pr">Command Center</Link></Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <select className="rounded-md border px-3 py-2 text-sm" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          {TYPES.map((t) => <option key={t || 'all'} value={t}>{t || 'All types'}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
          {SEVERITIES.map((s) => <option key={s || 'all'} value={s}>{s || 'All severities'}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s || 'all'} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((alert) => (
              <TableRow
                key={alert.id}
                className={highlight === alert.id ? 'bg-amber-50' : undefined}
              >
                <TableCell><StatusBadge status={alert.severity} /></TableCell>
                <TableCell><StatusBadge status={alert.type} /></TableCell>
                <TableCell>
                  <div className="font-medium">{alert.title}</div>
                  {alert.body && <p className="text-xs text-muted-foreground">{alert.body}</p>}
                  {alert.linkedAttack && (
                    <Link href="/media/attacks" className="text-xs text-navy underline">Attack: {alert.linkedAttack.title}</Link>
                  )}
                </TableCell>
                <TableCell><StatusBadge status={alert.status} /></TableCell>
                <TableCell className="text-sm">{new Date(alert.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {canEdit && alert.status === 'Open' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" disabled={ack.isPending} onClick={() => ack.mutate(alert.id)}>Ack</Button>
                      <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate(alert.id)}>Resolve</Button>
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
