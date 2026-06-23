'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ElectionListShell } from '@/components/crm/election-views';
import { formatDate } from '@/lib/utils';
import { fetchMaterialDistributions } from '@/lib/election';

export default function MaterialDistributionPage() {
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['election-material-distributions', page],
    queryFn: () => fetchMaterialDistributions({ page, limit: 20 }),
  });

  return (
    <ElectionListShell
      title="Material Distribution"
      description="Track material issued to mandals, booths and cadre."
      actions={
        <Link href="/election/materials">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to inventory</Button>
        </Link>
      }
    >
      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No distributions" description="Distribute materials from the inventory page." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Mandal</TableHead>
                <TableHead>Booth</TableHead>
                <TableHead>Issued to</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: {
                id: string;
                material?: { name: string; type: string } | null;
                quantity: number;
                mandal?: { name: string } | null;
                booth?: { number: string } | null;
                issuedToCadre?: { name: string } | null;
                createdAt: string;
              }) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium text-navy">{row.material?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{row.material?.type}</p>
                  </TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.mandal?.name ?? '—'}</TableCell>
                  <TableCell>{row.booth ? `Booth ${row.booth.number}` : '—'}</TableCell>
                  <TableCell>{row.issuedToCadre?.name ?? '—'}</TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}
    </ElectionListShell>
  );
}
