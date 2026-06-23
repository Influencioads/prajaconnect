'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/lib/auth';
import { createDonor, fetchDonors, formatCurrency } from '@/lib/fundraising';

export default function DonorsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('fundraising'));
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', mobile: '', email: '', address: '' });

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['fundraising-donors', page, debounced],
    queryFn: () => fetchDonors({ page, limit: 20, search: debounced }),
  });

  const createMut = useMutation({
    mutationFn: () => createDonor({
      name: form.name,
      mobile: form.mobile || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fundraising-donors'] });
      setShowForm(false);
      setForm({ name: '', mobile: '', email: '', address: '' });
    },
  });

  return (
    <>
      <PageHeader
        title="Donors"
        description="Search and manage donor records."
        actions={canEdit ? <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add donor'}</Button> : undefined}
      />

      {showForm && canEdit && (
        <div className="mb-4 grid gap-2 rounded-lg border p-4 md:grid-cols-2">
          <Input placeholder="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Mobile" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <Button disabled={!form.name.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
            Save donor
          </Button>
        </div>
      )}

      <div className="mb-4">
        <Input className="max-w-xs" placeholder="Search name, mobile, email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Donations</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Follow-ups</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Link href={`/fundraising/donors/${d.id}`} className="font-medium text-navy hover:underline">{d.name}</Link>
                </TableCell>
                <TableCell>{d.mobile ?? '—'}</TableCell>
                <TableCell>{d._count.donations}</TableCell>
                <TableCell>{formatCurrency(d.totalDonated)}</TableCell>
                <TableCell>{d._count.followUps}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
