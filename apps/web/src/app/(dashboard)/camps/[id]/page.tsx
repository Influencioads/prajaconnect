'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Users, CheckCircle2, Footprints, Flag } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
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
import { fetchCitizens } from '@/lib/crm';
import {
  CAMP_OUTCOMES,
  fetchCampDetail,
  fetchCampSummary,
  finalizeCamp,
  preregisterMatches,
  registerWalkIn,
  updateCampRegistration,
} from '@/lib/camps';

const NONE = '__none__';

export default function CampDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('camps'));
  const { toast } = useToast();
  const qc = useQueryClient();
  const [walkInOpen, setWalkInOpen] = React.useState(false);

  const { data: camp, isLoading } = useQuery({
    queryKey: ['camp-detail', id],
    queryFn: () => fetchCampDetail(id),
  });
  const { data: summary } = useQuery({
    queryKey: ['camp-summary', id],
    queryFn: () => fetchCampSummary(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['camp-detail', id] });
    qc.invalidateQueries({ queryKey: ['camp-summary', id] });
  };

  const preregMut = useMutation({
    mutationFn: () => preregisterMatches(id, camp?.targetSchemes ?? []),
    onSuccess: (r: { created: number }) => {
      invalidate();
      toast({ title: `${r.created} citizens pre-registered`, variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const regMut = useMutation({
    mutationFn: ({ regId, payload }: { regId: string; payload: Record<string, unknown> }) =>
      updateCampRegistration(regId, payload),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Registration updated', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const finalizeMut = useMutation({
    mutationFn: () => finalizeCamp(id),
    onSuccess: (r: { matchesUpdated: number }) => {
      invalidate();
      toast({
        title: 'Camp completed',
        description: `${r.matchesUpdated} scheme matches updated from outcomes`,
        variant: 'success',
      });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading camp…" />;
  if (!camp) return <EmptyState title="Camp not found" />;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/camps')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={camp.name}
        description={`${camp.type} · ${formatDate(camp.date)} · ${camp.village?.name ?? camp.mandal?.name ?? 'No location'}`}
        actions={
          canEdit ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={preregMut.isPending || !camp.targetSchemes.length}
                onClick={() => preregMut.mutate()}
              >
                <Users className="h-4 w-4" />
                {preregMut.isPending ? 'Pre-registering…' : 'Pre-register matches'}
              </Button>
              <Button variant="outline" onClick={() => setWalkInOpen(true)}>
                <UserPlus className="h-4 w-4" /> Walk-in
              </Button>
              {camp.status !== 'Completed' && (
                <Button disabled={finalizeMut.isPending} onClick={() => finalizeMut.mutate()}>
                  <Flag className="h-4 w-4" /> Finalize camp
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={camp.status} />
        {camp.schemes.map((s) => (
          <Badge key={s.id} variant="muted">{s.name}</Badge>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Registered" value={summary?.registered ?? 0} icon={Users} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Walk-ins" value={summary?.walkIn ?? 0} icon={Footprints} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Attended" value={summary?.attended ?? 0} icon={UserPlus} accent="bg-purple-100 text-purple-700" />
        <KpiCard label="Resolved on spot" value={summary?.resolved ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Registrations ({camp.registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {camp.registrations.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Citizen</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {camp.registrations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">#{r.token}</TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{r.citizen.name}</p>
                      <p className="text-xs text-muted-foreground">{r.citizen.mobile ?? '—'}</p>
                    </TableCell>
                    <TableCell><Badge variant="muted">{r.source}</Badge></TableCell>
                    <TableCell className="max-w-56 text-sm text-muted-foreground">{r.purpose ?? '—'}</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Select
                          value={r.outcome ?? NONE}
                          onValueChange={(v) =>
                            regMut.mutate({ regId: r.id, payload: { outcome: v === NONE ? null : v } })
                          }
                        >
                          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Set outcome" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>— Pending —</SelectItem>
                            {CAMP_OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : r.outcome ? (
                        <StatusBadge status={r.outcome} />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Button
                          variant={r.resolvedOnSpot ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            regMut.mutate({ regId: r.id, payload: { resolvedOnSpot: !r.resolvedOnSpot } })
                          }
                        >
                          {r.resolvedOnSpot ? 'Resolved' : 'Mark resolved'}
                        </Button>
                      ) : r.resolvedOnSpot ? (
                        <Badge variant="muted">Yes</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No registrations yet"
              description="Pre-register matched citizens or add walk-ins on camp day."
            />
          )}
        </CardContent>
      </Card>

      <WalkInDialog campId={id} open={walkInOpen} onOpenChange={setWalkInOpen} onDone={invalidate} />
    </>
  );
}

function WalkInDialog({
  campId,
  open,
  onOpenChange,
  onDone,
}: {
  campId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [citizenId, setCitizenId] = React.useState('');
  const [purpose, setPurpose] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data } = useQuery({
    queryKey: ['walkin-citizens', debounced],
    queryFn: () => fetchCitizens({ search: debounced || undefined, limit: 10 }),
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: () => registerWalkIn(campId, citizenId, purpose || undefined),
    onSuccess: (r: { token: number }) => {
      onDone();
      toast({ title: `Registered · token #${r.token}`, variant: 'success' });
      setCitizenId('');
      setSearch('');
      setPurpose('');
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Walk-in registration</DialogTitle></DialogHeader>
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
                {c.village?.name && <Badge variant="muted">{c.village.name}</Badge>}
              </button>
            ))}
            {!data?.data.length && <p className="py-4 text-center text-sm text-muted-foreground">No citizens.</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Pension application, ration card…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!citizenId || mut.isPending} onClick={() => mut.mutate()}>Register</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
