'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ElectionListShell, ElectionTableLink } from '@/components/crm/election-views';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  approveElectionExpense,
  fetchElectionExpenses,
  rejectElectionExpense,
} from '@/lib/election';

export default function ExpenseApprovalsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));
  const [page, setPage] = React.useState(1);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const filters = { page, limit: 20, status: 'Pending' };
  const { data, isLoading } = useQuery({
    queryKey: ['election-expense-approvals', filters],
    queryFn: () => fetchElectionExpenses(filters),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['election-expense-approvals'] });
    qc.invalidateQueries({ queryKey: ['election-expenses'] });
  };

  const approveMut = useMutation({
    mutationFn: (id: string) => approveElectionExpense(id),
    onSuccess: () => { invalidate(); toast({ title: 'Approved', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
    onSettled: () => setBusyId(null),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectElectionExpense(id),
    onSuccess: () => { invalidate(); toast({ title: 'Rejected', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
    onSettled: () => setBusyId(null),
  });

  return (
    <ElectionListShell
      title="Expense Approvals"
      description="Review and approve pending campaign expenses."
      actions={
        <Link href="/election/expenses">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to list</Button>
        </Link>
      }
    >
      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No pending expenses" description="All expenses have been reviewed." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Submitted by</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell><ElectionTableLink href={`/election/expenses/${row.id}`}>{row.title}</ElectionTableLink></TableCell>
                  <TableCell>{row.category.label}</TableCell>
                  <TableCell>₹{row.amount.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(row.expenseDate)}</TableCell>
                  <TableCell>{row.createdBy?.name ?? '—'}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={busyId === row.id}
                          onClick={() => { setBusyId(row.id); approveMut.mutate(row.id); }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === row.id}
                          onClick={() => { setBusyId(row.id); rejectMut.mutate(row.id); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
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
