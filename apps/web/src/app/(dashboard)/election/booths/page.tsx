'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { BoothStrength } from '@praja/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ElectionListShell } from '@/components/crm/election-views';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { fetchGeoOptions } from '@/lib/crm';
import { createElectionBooth, fetchElectionBooths } from '@/lib/election';

const ALL = '__all__';
const NONE = '__none__';
const STRENGTHS = Object.values(BoothStrength);

export default function ElectionBoothsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [strength, setStrength] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  const [boothId, setBoothId] = React.useState('');
  const [boothStrength, setBoothStrength] = React.useState<BoothStrength>(BoothStrength.Swing);
  const [readinessScore, setReadinessScore] = React.useState('50');
  const [voterCount, setVoterCount] = React.useState('');
  const [issues, setIssues] = React.useState('');
  const [committeeNotes, setCommitteeNotes] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, strength, mandalId]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    strength: strength === ALL ? undefined : strength,
    mandalId: mandalId === ALL ? undefined : mandalId,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['election-booths', filters],
    queryFn: () => fetchElectionBooths(filters),
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });

  const createMut = useMutation({
    mutationFn: () =>
      createElectionBooth({
        boothId,
        strength: boothStrength,
        readinessScore: Number(readinessScore),
        voterCount: voterCount ? Number(voterCount) : undefined,
        issues: issues || undefined,
        committeeNotes: committeeNotes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-booths'] });
      toast({ title: 'Booth plan created', variant: 'success' });
      setDialog(false);
      setBoothId('');
      setIssues('');
      setCommitteeNotes('');
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <ElectionListShell
      title="Booth Plans"
      description="Booth-level readiness, strength and committee planning."
      actions={canEdit ? <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Add booth plan</Button> : undefined}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search booths…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={strength} onValueChange={setStrength}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Strength" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {STRENGTHS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={mandalId} onValueChange={setMandalId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Mandal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All mandals</SelectItem>
            {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No booth plans" description="Create booth plans for polling readiness." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booth</TableHead>
                <TableHead>Mandal</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>Readiness</TableHead>
                <TableHead>Voters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: {
                id: string;
                booth?: { number: string; name?: string | null; village?: { mandal?: { name: string } } };
                strength?: string; readinessScore?: number; voterCount?: number;
              }) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-navy">
                    Booth {row.booth?.number}{row.booth?.name ? ` · ${row.booth.name}` : ''}
                  </TableCell>
                  <TableCell>{row.booth?.village?.mandal?.name ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={row.strength ?? '—'} /></TableCell>
                  <TableCell>{row.readinessScore ?? 0}%</TableCell>
                  <TableCell>{row.voterCount ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create booth plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Booth</Label>
              <Select value={boothId || NONE} onValueChange={(v) => setBoothId(v === NONE ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select booth" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select…</SelectItem>
                  {geo?.booths.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Strength</Label>
                <Select value={boothStrength} onValueChange={(v) => setBoothStrength(v as BoothStrength)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STRENGTHS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Readiness %</Label>
                <Input type="number" min={0} max={100} value={readinessScore} onChange={(e) => setReadinessScore(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Voter count</Label>
              <Input type="number" min={0} value={voterCount} onChange={(e) => setVoterCount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Issues</Label>
              <Textarea value={issues} onChange={(e) => setIssues(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Committee notes</Label>
              <Textarea value={committeeNotes} onChange={(e) => setCommitteeNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button className="bg-gold text-navy hover:bg-gold/90" disabled={!boothId || createMut.isPending} onClick={() => createMut.mutate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ElectionListShell>
  );
}
