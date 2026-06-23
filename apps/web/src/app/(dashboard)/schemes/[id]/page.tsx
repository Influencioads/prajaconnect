'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, HandCoins } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import {
  fetchSchemeDetail,
  fetchCitizens,
  enrollBeneficiary,
  updateBeneficiary,
} from '@/lib/crm';

const STATUSES = ['Pending', 'Enrolled', 'Disbursed', 'Rejected'];

export default function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('schemes'));
  const { toast } = useToast();
  const qc = useQueryClient();
  const [enrollOpen, setEnrollOpen] = React.useState(false);

  const { data: s, isLoading, isError } = useQuery({
    queryKey: ['scheme-detail', id],
    queryFn: () => fetchSchemeDetail(id),
  });

  const statusMut = useMutation({
    mutationFn: ({ bid, status }: { bid: string; status: string }) =>
      updateBeneficiary(bid, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheme-detail', id] });
      qc.invalidateQueries({ queryKey: ['scheme-stats'] });
      toast({ title: 'Beneficiary updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading scheme…" />;
  if (isError || !s) return <EmptyState title="Scheme not found" />;

  const eligibility = (s.eligibility ?? {}) as Record<string, unknown>;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/schemes')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={s.name}
        description={`${s.code} · ${s.category ?? 'Welfare'}`}
        actions={
          canEdit ? (
            <Button onClick={() => setEnrollOpen(true)}>
              <Plus className="h-4 w-4" /> Enroll citizen
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/20 text-gold-600">
                <HandCoins className="h-6 w-6" />
              </div>
              <div>
                <StatusBadge status={s.status} />
                <p className="mt-1 text-lg font-bold">
                  {s.benefitAmount ? `₹${formatNumber(s.benefitAmount)}` : '—'}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{s.description}</p>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{s.department ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Eligibility criteria</p>
              {Object.keys(eligibility).length ? (
                <ul className="mt-1 space-y-1 text-sm">
                  {Object.entries(eligibility).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Open to all.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Beneficiaries ({s.beneficiaries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {s.beneficiaries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Citizen</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Disbursed</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.beneficiaries.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.citizen.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(b.appliedAt)}</TableCell>
                      <TableCell className="text-sm">
                        {b.disbursedAmount ? `₹${formatNumber(b.disbursedAmount)}` : '—'}
                      </TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                      {canEdit && (
                        <TableCell>
                          <Select
                            value={b.status}
                            onValueChange={(v) => statusMut.mutate({ bid: b.id, status: v })}
                          >
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="No beneficiaries yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <EnrollDialog schemeId={id} open={enrollOpen} onOpenChange={setEnrollOpen} />
    </>
  );
}

function EnrollDialog({
  schemeId,
  open,
  onOpenChange,
}: {
  schemeId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [citizenId, setCitizenId] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data } = useQuery({
    queryKey: ['enroll-citizens', debounced],
    queryFn: () => fetchCitizens({ search: debounced || undefined, limit: 10 }),
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: () => enrollBeneficiary(schemeId, citizenId, 'Pending'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheme-detail', schemeId] });
      qc.invalidateQueries({ queryKey: ['scheme-stats'] });
      toast({ title: 'Citizen enrolled', variant: 'success' });
      setCitizenId('');
      setSearch('');
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Enroll citizen</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Search citizen</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, mobile, voter ID…" />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {data?.data.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCitizenId(c.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                  citizenId === c.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground"> · {c.mobile ?? '—'}</span>
                </span>
                {c.mandal?.name && <Badge variant="muted">{c.mandal.name}</Badge>}
              </button>
            ))}
            {!data?.data.length && <p className="py-4 text-center text-sm text-muted-foreground">No citizens.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!citizenId || mut.isPending} onClick={() => mut.mutate()}>Enroll</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
