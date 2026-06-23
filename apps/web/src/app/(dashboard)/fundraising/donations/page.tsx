'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { fetchDonations, formatCurrency } from '@/lib/fundraising';

export default function DonationsLedgerPage() {
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['fundraising-donations', page],
    queryFn: () => fetchDonations({ page, limit: 25 }),
  });

  return (
    <>
      <PageHeader title="Donations Ledger" description="All recorded donations with receipt status." />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((d) => (
              <TableRow key={d.id}>
                <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {d.donor ? (
                    <Link href={`/fundraising/donors/${d.donor.id}`} className="text-navy hover:underline">{d.donor.name}</Link>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Link href={`/fundraising/donations/${d.id}`} className="font-medium hover:underline">
                    {formatCurrency(d.amount)}
                  </Link>
                </TableCell>
                <TableCell><StatusBadge status={d.paymentMode} /></TableCell>
                <TableCell>{d.event?.name ?? '—'}</TableCell>
                <TableCell>{d.receipt?.receiptNo ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
