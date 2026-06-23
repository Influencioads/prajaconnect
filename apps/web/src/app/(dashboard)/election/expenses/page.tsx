'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { ElectionListShell, ElectionTableLink } from '@/components/crm/election-views';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { fetchElectionExpenses } from '@/lib/election';

const ALL = '__all__';

export default function ElectionExpensesPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, status]);

  const filters = { page, limit: 20, search: debounced || undefined, status: status === ALL ? undefined : status };
  const { data, isLoading } = useQuery({ queryKey: ['election-expenses', filters], queryFn: () => fetchElectionExpenses(filters) });

  return (
    <ElectionListShell
      title="Election Expenses"
      description="Track campaign expenses with approval workflow and geo tagging."
      actions={
        canEdit ? (
          <div className="flex gap-2">
            <Link href="/election/expenses/approvals"><Button variant="outline">Approvals</Button></Link>
            <Link href="/election/expenses/new"><Button><Plus className="h-4 w-4" /> Add Expense</Button></Link>
          </div>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search expenses…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All status</SelectItem>
            {['Pending', 'Approved', 'Rejected'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No expenses" description="Add your first campaign expense." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Mandal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell><ElectionTableLink href={`/election/expenses/${row.id}`}>{row.title}</ElectionTableLink></TableCell>
                  <TableCell>{row.category.label}</TableCell>
                  <TableCell>₹{row.amount.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(row.expenseDate)}</TableCell>
                  <TableCell>{row.mandal?.name ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
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
