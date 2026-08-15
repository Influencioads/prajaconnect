'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Mail, FileText, CheckCircle2, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { fetchLetters, fetchLetterStats, LETTER_TYPE_LABELS } from '@/lib/letters';

const ALL = '__all__';

export default function LettersPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('letters'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [type, setType] = React.useState(ALL);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, status, type]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status === ALL ? undefined : status,
    type: type === ALL ? undefined : type,
  };

  const { data: stats } = useQuery({ queryKey: ['letter-stats'], queryFn: fetchLetterStats });
  const { data, isLoading } = useQuery({
    queryKey: ['letters', filters],
    queryFn: () => fetchLetters(filters),
  });

  return (
    <>
      <PageHeader
        title="AI Letter Drafting Studio"
        description="Draft, finalize and dispatch official letters with AI assistance."
        actions={
          canEdit ? (
            <Button asChild>
              <Link href="/letters/new">
                <Plus className="h-4 w-4" /> New letter
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total" value={stats?.total ?? 0} icon={Mail} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Draft" value={stats?.byStatus?.Draft ?? 0} icon={FileText} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Final" value={stats?.byStatus?.Final ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <KpiCard label="Issued" value={stats?.byStatus?.Issued ?? 0} icon={Send} accent="bg-violet-100 text-violet-700" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by ref no, subject, addressee…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {['Draft', 'Final', 'Issued'].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No letters found" description="Adjust filters or draft a new letter." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref No</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Addressee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.refNo}</TableCell>
                      <TableCell>
                        <Link href={`/letters/${l.id}`} className="font-semibold text-foreground hover:text-primary">
                          {l.subject}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {l.grievance ? `Grievance ${l.grievance.code}` : l.citizen?.name ?? l.createdBy?.name ?? '—'}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {LETTER_TYPE_LABELS[l.type] ?? l.type}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.addresseeName}
                        {l.addresseeDesignation ? (
                          <p className="text-xs">{l.addresseeDesignation}</p>
                        ) : null}
                      </TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.pdfUrl ? 'Yes' : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(l.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
