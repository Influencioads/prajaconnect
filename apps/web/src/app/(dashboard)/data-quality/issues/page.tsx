'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { detectCitizenDuplicates, detectGrievanceDuplicates, fetchDataQualityIssues, resolveDataQualityIssue } from '@/lib/data-quality';
import { useAuth } from '@/lib/auth';

export default function DataQualityIssuesPage() {
  const [page, setPage] = React.useState(1);
  const [resolved, setResolved] = React.useState('false');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('dataquality'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['data-quality-issues', page, resolved],
    queryFn: () => fetchDataQualityIssues({ page, limit: 20, resolved }),
  });

  const resolve = useMutation({
    mutationFn: resolveDataQualityIssue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['data-quality-issues'] }),
  });

  const detectCitizens = useMutation({
    mutationFn: detectCitizenDuplicates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['data-quality-issues'] }),
  });

  const detectGrievances = useMutation({
    mutationFn: detectGrievanceDuplicates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['data-quality-issues'] }),
  });

  return (
    <>
      <PageHeader title="Data Quality Issues" description="Duplicate detection and data hygiene flags." />
      {canEdit && (
        <div className="mb-4 flex gap-2">
          <Button variant="outline" disabled={detectCitizens.isPending} onClick={() => detectCitizens.mutate()}>Detect citizen duplicates</Button>
          <Button variant="outline" disabled={detectGrievances.isPending} onClick={() => detectGrievances.mutate()}>Detect grievance duplicates</Button>
        </div>
      )}
      <div className="mb-4 flex gap-2">
        <Button variant={resolved === 'false' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved('false'); setPage(1); }}>Open</Button>
        <Button variant={resolved === 'true' ? 'default' : 'outline'} size="sm" onClick={() => { setResolved('true'); setPage(1); }}>Resolved</Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Entity</TableHead><TableHead>Issue</TableHead><TableHead>Score</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((i: { id: string; entityType: string; entityId: string; issueType: string; score: number; resolved: boolean }) => (
              <TableRow key={i.id}>
                <TableCell>{i.entityType} · {i.entityId.slice(0, 8)}…</TableCell>
                <TableCell>{i.issueType}</TableCell>
                <TableCell>{Math.round(i.score * 100)}%</TableCell>
                <TableCell>{canEdit && !i.resolved && <Button size="sm" onClick={() => resolve.mutate(i.id)}>Resolve</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPage={setPage} />}
    </>
  );
}
