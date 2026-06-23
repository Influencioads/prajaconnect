'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { fetchDonation, formatCurrency, issueDonationReceipt } from '@/lib/fundraising';

function DonationReceiptPreview({
  receiptNo,
  issuedAt,
  donorName,
  amount,
  paymentMode,
  eventName,
  notes,
}: {
  receiptNo: string;
  issuedAt: string;
  donorName: string;
  amount: number;
  paymentMode: string;
  eventName?: string | null;
  notes?: string | null;
}) {
  return (
    <div id="donation-receipt" className="mx-auto max-w-md rounded-lg border-2 border-navy bg-white p-8 text-navy print:border-black print:shadow-none">
      <div className="text-center">
        <h2 className="text-xl font-bold">Praja Connect</h2>
        <p className="text-sm text-muted-foreground">Donation Receipt</p>
      </div>
      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between"><span>Receipt No.</span><strong>{receiptNo}</strong></div>
        <div className="flex justify-between"><span>Date</span><span>{new Date(issuedAt).toLocaleDateString()}</span></div>
        <div className="flex justify-between"><span>Donor</span><span>{donorName}</span></div>
        <div className="flex justify-between"><span>Amount</span><strong>{formatCurrency(amount)}</strong></div>
        <div className="flex justify-between"><span>Payment</span><span>{paymentMode}</span></div>
        {eventName && <div className="flex justify-between"><span>Event</span><span>{eventName}</span></div>}
        {notes && <p className="border-t pt-2 text-xs text-muted-foreground">{notes}</p>}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">Thank you for your generous contribution.</p>
    </div>
  );
}

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('fundraising'));
  const qc = useQueryClient();

  const { data: donation, isLoading } = useQuery({
    queryKey: ['fundraising-donation', id],
    queryFn: () => fetchDonation(id),
  });

  const receiptMut = useMutation({
    mutationFn: () => issueDonationReceipt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fundraising-donation', id] }),
  });

  const printReceipt = () => window.print();

  if (isLoading || !donation) return <div className="p-6">Loading…</div>;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #donation-receipt, #donation-receipt * { visibility: visible; }
          #donation-receipt { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <PageHeader
        title={formatCurrency(donation.amount)}
        description={`Donation by ${donation.donor.name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/fundraising/donations">Back to ledger</Link></Button>
            {donation.receipt && (
              <Button variant="gold" onClick={printReceipt}>
                <Printer className="mr-2 h-4 w-4" /> Print receipt
              </Button>
            )}
            {canEdit && !donation.receipt && (
              <Button onClick={() => receiptMut.mutate()} disabled={receiptMut.isPending}>
                Issue receipt
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Donation Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Donor: <Link href={`/fundraising/donors/${donation.donor.id}`} className="font-medium text-navy hover:underline">{donation.donor.name}</Link></p>
            <p>Mobile: {donation.donor.mobile ?? '—'}</p>
            <p>Amount: <strong>{formatCurrency(donation.amount)}</strong></p>
            <p>Payment: <StatusBadge status={donation.paymentMode} /></p>
            <p>Event: {donation.event?.name ?? '—'}</p>
            <p>Date: {new Date(donation.createdAt).toLocaleString()}</p>
            {donation.notes && <p>Notes: {donation.notes}</p>}
            <p>Receipt: {donation.receipt?.receiptNo ?? 'Not issued'}</p>
          </CardContent>
        </Card>

        {donation.receipt && (
          <Card>
            <CardHeader><CardTitle>Receipt Preview</CardTitle></CardHeader>
            <CardContent>
              <DonationReceiptPreview
                receiptNo={donation.receipt.receiptNo}
                issuedAt={donation.receipt.issuedAt}
                donorName={donation.donor.name}
                amount={donation.amount}
                paymentMode={donation.paymentMode}
                eventName={donation.event?.name}
                notes={donation.notes}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
