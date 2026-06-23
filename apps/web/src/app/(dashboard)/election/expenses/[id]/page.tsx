'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  approveElectionExpense,
  fetchElectionExpense,
  rejectElectionExpense,
} from '@/lib/election';

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));
  const [remarks, setRemarks] = React.useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['election-expense', id],
    queryFn: () => fetchElectionExpense(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['election-expense', id] });
    qc.invalidateQueries({ queryKey: ['election-expenses'] });
    qc.invalidateQueries({ queryKey: ['election-expense-approvals'] });
  };

  const approveMut = useMutation({
    mutationFn: () => approveElectionExpense(id, remarks || undefined),
    onSuccess: () => { invalidate(); toast({ title: 'Expense approved', variant: 'success' }); setRemarks(''); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectElectionExpense(id, remarks || undefined),
    onSuccess: () => { invalidate(); toast({ title: 'Expense rejected', variant: 'success' }); setRemarks(''); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading expense…" />;
  if (isError || !data) return <EmptyState title="Expense not found" />;

  const pending = data.status === 'Pending';

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/election/expenses')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={data.title}
        description={`${data.category.label} · ${formatDate(data.expenseDate)}`}
        actions={<StatusBadge status={data.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">Amount</p><p className="text-lg font-semibold text-navy">₹{data.amount.toLocaleString()}</p></div>
            <div><p className="text-sm text-muted-foreground">Payment</p><p className="font-medium">{data.paymentMode}</p></div>
            <div><p className="text-sm text-muted-foreground">Vendor</p><p>{data.vendorName ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Paid by</p><p>{data.paidBy ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Mandal</p><p>{data.mandal?.name ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Booth</p><p>{data.booth ? `Booth ${data.booth.number}` : '—'}</p></div>
            {data.notes && (
              <div className="sm:col-span-2"><p className="text-sm text-muted-foreground">Notes</p><p>{data.notes}</p></div>
            )}
            {data.receiptUrl && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Receipt</p>
                <Link href={data.receiptUrl} target="_blank" className="text-navy hover:underline">View receipt</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {pending && canEdit && (
          <Card>
            <CardHeader><CardTitle>Approval</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Remarks (optional)</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
              </div>
              <div className="flex flex-col gap-2">
                <Button className="bg-green-600 hover:bg-green-700" disabled={approveMut.isPending} onClick={() => approveMut.mutate()}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button variant="destructive" disabled={rejectMut.isPending} onClick={() => rejectMut.mutate()}>
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
