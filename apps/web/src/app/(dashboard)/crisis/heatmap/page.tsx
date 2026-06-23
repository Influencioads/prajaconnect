'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { downloadCrisisReport, fetchHeatmapMandals, fetchHeatmapVillages } from '@/lib/crisis';

export default function CrisisHeatmapPage() {
  const [view, setView] = React.useState<'villages' | 'mandals'>('villages');

  const { data: villages, isLoading: loadingV } = useQuery({
    queryKey: ['crisis-heatmap-villages'],
    queryFn: fetchHeatmapVillages,
    enabled: view === 'villages',
  });

  const { data: mandals, isLoading: loadingM } = useQuery({
    queryKey: ['crisis-heatmap-mandals'],
    queryFn: fetchHeatmapMandals,
    enabled: view === 'mandals',
  });

  const rows = view === 'villages' ? villages : mandals;
  const isLoading = view === 'villages' ? loadingV : loadingM;

  return (
    <>
      <PageHeader
        title="Issue Heatmap"
        description="Open and active issues aggregated by geography."
        actions={
          <Button variant="gold" onClick={() => downloadCrisisReport(view === 'villages' ? 'heatmap-villages' : 'heatmap-mandals')}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        <Button variant={view === 'villages' ? 'default' : 'outline'} size="sm" onClick={() => setView('villages')}>By Village</Button>
        <Button variant={view === 'mandals' ? 'default' : 'outline'} size="sm" onClick={() => setView('mandals')}>By Mandal</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{view === 'villages' ? 'Village' : 'Mandal'}</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Critical</TableHead>
              <TableHead>High</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead>Low</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow> : (rows ?? []).map((r) => (
              <TableRow key={r.villageId ?? r.mandalId}>
                <TableCell className="font-medium">{r.villageName ?? r.mandalName}</TableCell>
                <TableCell>{r.total}</TableCell>
                <TableCell className="text-red-600">{r.critical}</TableCell>
                <TableCell className="text-orange-600">{r.high}</TableCell>
                <TableCell>{r.medium}</TableCell>
                <TableCell>{r.low}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
