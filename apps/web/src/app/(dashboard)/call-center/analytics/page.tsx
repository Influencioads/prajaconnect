'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadCallCenterReport, fetchAgentPerformance, fetchDispositionReport } from '@/lib/call-center';

export default function CallCenterAnalyticsPage() {
  const { data: agents } = useQuery({ queryKey: ['call-agent-performance'], queryFn: fetchAgentPerformance });
  const { data: dispositions } = useQuery({ queryKey: ['call-disposition-report'], queryFn: fetchDispositionReport });

  return (
    <>
      <PageHeader
        title="Call Center Analytics"
        description="Agent performance and disposition breakdown."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadCallCenterReport('agent-performance')}>Export agents</Button>
            <Button variant="outline" onClick={() => downloadCallCenterReport('disposition')}>Export dispositions</Button>
          </div>
        }
      />
      <h3 className="mb-2 font-semibold">Agent performance</h3>
      <div className="mb-6 rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Status</TableHead><TableHead>Calls</TableHead><TableHead>Avg duration (s)</TableHead></TableRow></TableHeader>
          <TableBody>
            {(agents ?? []).map((a: { agentId: string; name: string; status: string; totalCalls: number; avgDurationSec: number }) => (
              <TableRow key={a.agentId}>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.status}</TableCell>
                <TableCell>{a.totalCalls}</TableCell>
                <TableCell>{a.avgDurationSec}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <h3 className="mb-2 font-semibold">Disposition report</h3>
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Disposition</TableHead><TableHead>Count</TableHead><TableHead>Avg duration (s)</TableHead></TableRow></TableHeader>
          <TableBody>
            {(dispositions ?? []).map((d: { disposition: string; count: number; avgDurationSec: number }) => (
              <TableRow key={d.disposition}>
                <TableCell>{d.disposition}</TableCell>
                <TableCell>{d.count}</TableCell>
                <TableCell>{d.avgDurationSec}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
