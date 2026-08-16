'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tent, CalendarClock, CheckCircle2, Users, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { fetchGeoOptions, fetchSchemes } from '@/lib/crm';
import { CAMP_STATUSES, createCamp, fetchCamps, fetchCampStats } from '@/lib/camps';

const ALL = '__all__';
const CAMP_TYPES = ['General', 'Scheme Enrollment', 'Health', 'Pension', 'Ration', 'Other'];

export default function CampsPage() {
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('camps'));
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats } = useQuery({ queryKey: ['camp-stats'], queryFn: fetchCampStats });
  const { data, isLoading } = useQuery({
    queryKey: ['camps', debounced, status, page],
    queryFn: () =>
      fetchCamps({
        search: debounced || undefined,
        status: status === ALL ? undefined : status,
        page,
        limit: 20,
      }),
  });

  return (
    <>
      <PageHeader
        title="Service Camps"
        description="Village-level scheme enrollment and service delivery camps."
        actions={
          canEdit ? (
            <Button onClick={() => setDialog(true)}>
              <Plus className="h-4 w-4" /> New camp
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total camps" value={stats?.total ?? 0} icon={Tent} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Upcoming" value={stats?.upcoming ?? 0} icon={CalendarClock} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <KpiCard label="Registrations" value={stats?.registrations ?? 0} icon={Users} accent="bg-purple-100 text-purple-700" />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search camps…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {CAMP_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No camps found" description="Create a camp to start pre-registering matched citizens." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Camp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/camps/${c.id}`)}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell><Badge variant="muted">{c.type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.date)}</TableCell>
                      <TableCell className="text-sm">
                        {c.village?.name ?? c.mandal?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">{c._count.registrations}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.meta && (
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CampFormDialog open={dialog} onOpenChange={setDialog} />
    </>
  );
}

const initial = {
  name: '',
  type: 'General',
  date: '',
  mandalId: '',
  villageId: '',
  notes: '',
};

function CampFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState(initial);
  const [schemeIds, setSchemeIds] = React.useState<string[]>([]);
  const NONE = '__none__';

  React.useEffect(() => {
    if (open) {
      setForm(initial);
      setSchemeIds([]);
    }
  }, [open]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions, enabled: open });
  const { data: schemes } = useQuery({
    queryKey: ['camp-schemes'],
    queryFn: () => fetchSchemes({ status: 'Active', limit: 100 }),
    enabled: open,
  });

  const set = (k: keyof typeof initial, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleScheme = (id: string) =>
    setSchemeIds((ids) => (ids.includes(id) ? ids.filter((s) => s !== id) : [...ids, id]));

  const mut = useMutation({
    mutationFn: () =>
      createCamp({
        name: form.name,
        type: form.type,
        date: new Date(form.date).toISOString(),
        mandalId: form.mandalId || undefined,
        villageId: form.villageId || undefined,
        targetSchemes: schemeIds,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camps'] });
      qc.invalidateQueries({ queryKey: ['camp-stats'] });
      toast({ title: 'Camp created', variant: 'success' });
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const villages = geo?.villages.filter((v) => !form.mandalId || v.mandalId === form.mandalId) ?? [];
  const valid = form.name.trim().length >= 3 && !!form.date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New service camp</DialogTitle></DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Pension enrollment camp, Atmakur" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mandal</Label>
            <Select value={form.mandalId || NONE} onValueChange={(v) => setForm((f) => ({ ...f, mandalId: v === NONE ? '' : v, villageId: '' }))}>
              <SelectTrigger><SelectValue placeholder="Select mandal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Village</Label>
            <Select value={form.villageId || NONE} onValueChange={(v) => set('villageId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Target schemes</Label>
            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border p-3">
              {schemes?.data.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleScheme(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    schemeIds.includes(s.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {!schemes?.data.length && (
                <p className="text-sm text-muted-foreground">No active schemes.</p>
              )}
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Logistics, staff, materials…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? 'Creating…' : 'Create camp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
