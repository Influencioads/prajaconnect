'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { downloadManifestoReport, fetchDepartmentMatrix, formatCurrency } from '@/lib/manifesto';

export default function ManifestoDepartmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['manifesto-departments'],
    queryFn: fetchDepartmentMatrix,
  });

  return (
    <>
      <PageHeader
        title="Department Matrix"
        description="Promise delivery breakdown by department."
        actions={<Button variant="gold" onClick={() => downloadManifestoReport('departments')}><Download className="mr-2 h-4 w-4" /> Export</Button>}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>In Progress</TableHead>
              <TableHead>Delayed</TableHead>
              <TableHead>Avg Completion</TableHead>
              <TableHead>Budget</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow> : (data ?? []).map((r) => (
              <TableRow key={r.department}>
                <TableCell className="font-medium">{r.department}</TableCell>
                <TableCell>{r.total}</TableCell>
                <TableCell>{r.completed}</TableCell>
                <TableCell>{r.inProgress}</TableCell>
                <TableCell>{r.delayed}</TableCell>
                <TableCell>{r.avgCompletion}%</TableCell>
                <TableCell>{formatCurrency(r.budgetSpent)} / {formatCurrency(r.budgetTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
