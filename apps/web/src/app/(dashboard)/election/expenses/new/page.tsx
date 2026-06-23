'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { fetchGeoOptions } from '@/lib/crm';
import { PaymentMode } from '@praja/types';
import {
  createElectionExpense,
  fetchExpenseCategories,
  uploadElectionFile,
} from '@/lib/election';

const NONE = '__none__';
const PAYMENT_MODES = Object.values(PaymentMode);

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [title, setTitle] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = React.useState(PaymentMode.Cash);
  const [mandalId, setMandalId] = React.useState(NONE);
  const [boothId, setBoothId] = React.useState(NONE);
  const [vendorName, setVendorName] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [receiptUrl, setReceiptUrl] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['election-expense-categories'],
    queryFn: fetchExpenseCategories,
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });

  const booths = React.useMemo(() => {
    if (!geo || mandalId === NONE) return geo?.booths ?? [];
    const villageIds = new Set(geo.villages.filter((v) => v.mandalId === mandalId).map((v) => v.id));
    return geo.booths.filter((b) => villageIds.has(b.villageId));
  }, [geo, mandalId]);

  const createMut = useMutation({
    mutationFn: () =>
      createElectionExpense({
        title,
        categoryId,
        amount: Number(amount),
        expenseDate,
        paymentMode,
        mandalId: mandalId === NONE ? undefined : mandalId,
        boothId: boothId === NONE ? undefined : boothId,
        vendorName: vendorName || undefined,
        notes: notes || undefined,
        receiptUrl: receiptUrl || undefined,
      }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['election-expenses'] });
      toast({ title: 'Expense submitted', variant: 'success' });
      router.push(`/election/expenses/${row.id}`);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadElectionFile(file);
      setReceiptUrl(res.url);
      toast({ title: 'Receipt uploaded', variant: 'success' });
    } catch (err) {
      toast({ title: 'Upload failed', description: apiError(err), variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  if (!canEdit) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">You do not have permission to add expenses.</CardContent></Card>
    );
  }

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/election/expenses"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>
      <PageHeader title="Add Expense" description="Submit a campaign expense for approval." />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {catLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Expense title" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Payment mode</Label>
                  <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mandal (optional)</Label>
                  <Select value={mandalId} onValueChange={(v) => { setMandalId(v); setBoothId(NONE); }}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Booth (optional)</Label>
                  <Select value={boothId} onValueChange={setBoothId} disabled={mandalId === NONE}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {booths.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vendor (optional)</Label>
                  <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Receipt</Label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" disabled={uploading} asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Uploading…' : 'Upload receipt'}
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} />
                      </label>
                    </Button>
                    {receiptUrl && <span className="text-sm text-green-700">Receipt attached</span>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => router.push('/election/expenses')}>Cancel</Button>
                <Button
                  className="bg-gold text-navy hover:bg-gold/90"
                  disabled={!title || !categoryId || !amount || createMut.isPending}
                  onClick={() => createMut.mutate()}
                >
                  {createMut.isPending ? 'Submitting…' : 'Submit expense'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
