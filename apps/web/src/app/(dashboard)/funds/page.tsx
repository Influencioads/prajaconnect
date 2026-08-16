'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Banknote, HandCoins, ClipboardCheck, Plus, CalendarClock, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import {
  FUND_STAGES,
  advanceFundWorkStage,
  createFundSource,
  createFundWork,
  fetchFundSources,
  fetchFundWorks,
  fetchFundsDashboard,
  rupees,
  type FundSource as FundSourceOption,
  type FundStage,
  type FundWork,
} from '@/lib/funds';

const ALL = '__all__';

const STAGE_COLORS: Record<string, string> = {
  Recommended: 'bg-slate-100 text-slate-700',
  Sanctioned: 'bg-blue-100 text-blue-700',
  Released: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  UCSubmitted: 'bg-purple-100 text-purple-700',
};

function nextStage(stage: FundStage): FundStage | null {
  const i = FUND_STAGES.indexOf(stage);
  return i >= 0 && i < FUND_STAGES.length - 1 ? FUND_STAGES[i + 1] : null;
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_COLORS[stage] ?? 'bg-muted text-muted-foreground'}`}>
      {stage === 'UCSubmitted' ? 'UC Submitted' : stage}
    </span>
  );
}

function UtilBar({ value, danger }: { value: number; danger?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${danger ? 'bg-red-500' : 'bg-navy'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FundsPage() {
  const qc = useQueryClient();
  const [stage, setStage] = React.useState(ALL);
  const [sourceFilter, setSourceFilter] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [sourceDialog, setSourceDialog] = React.useState(false);
  const [workDialog, setWorkDialog] = React.useState(false);
  const [advancing, setAdvancing] = React.useState<FundWork | null>(null);

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ['funds-dashboard'],
    queryFn: fetchFundsDashboard,
  });
  const { data: sources } = useQuery({ queryKey: ['fund-sources'], queryFn: fetchFundSources });
  const { data: works, isLoading: worksLoading } = useQuery({
    queryKey: ['fund-works', stage, sourceFilter, page],
    queryFn: () =>
      fetchFundWorks({
        stage: stage === ALL ? undefined : stage,
        fundSourceId: sourceFilter === ALL ? undefined : sourceFilter,
        page,
        limit: 20,
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['funds-dashboard'] });
    qc.invalidateQueries({ queryKey: ['fund-works'] });
    qc.invalidateQueries({ queryKey: ['fund-sources'] });
  };

  return (
    <>
      <PageHeader
        title="MPLADS / CDP Fund Ledger"
        description="Allocation, sanction, release and utilization certificates per fund source."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSourceDialog(true)}>
              <Plus className="h-4 w-4" /> Fund source
            </Button>
            <Button onClick={() => setWorkDialog(true)}>
              <Plus className="h-4 w-4" /> New work
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Allocated" value={rupees(dash?.totals.allocated ?? 0)} icon={Wallet} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Released" value={rupees(dash?.totals.released ?? 0)} icon={Banknote} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Unspent balance" value={rupees(dash?.totals.unspent ?? 0)} icon={HandCoins} accent="bg-red-100 text-red-700" />
        <KpiCard label="UC submitted" value={rupees(dash?.totals.ucSubmitted ?? 0)} icon={ClipboardCheck} accent="bg-emerald-100 text-emerald-700" />
      </div>

      {dashLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !dash?.sources.length ? (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <EmptyState title="No fund sources" description="Add a fund source (e.g. MPLADS 2026-27) to start the ledger." />
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {dash.sources.map((s) => {
            const unspentPct = s.allocated ? Math.round((s.unspent / s.allocated) * 100) : 0;
            const atRisk = s.daysToFyEnd !== null && s.daysToFyEnd < 183 && unspentPct > 50;
            return (
              <Card key={s.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold">{s.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="muted">{s.type}</Badge>
                        <Badge variant="muted">FY {s.financialYear}</Badge>
                        {!s.active && <Badge variant="muted">Inactive</Badge>}
                      </div>
                    </div>
                    {s.daysToFyEnd !== null && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${atRisk ? 'text-red-600' : 'text-muted-foreground'}`}>
                        <CalendarClock className="h-3.5 w-3.5" /> {s.daysToFyEnd}d to FY end
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Utilization (released / allocated)</span>
                      <span className="font-semibold">{s.utilizationPct}%</span>
                    </div>
                    <UtilBar value={s.utilizationPct} danger={atRisk} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-semibold text-foreground">{rupees(s.allocated)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recommended</p>
                      <p className="font-semibold text-foreground">{rupees(s.recommended)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sanctioned</p>
                      <p className="font-semibold text-foreground">{rupees(s.sanctioned)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Released</p>
                      <p className="font-semibold text-foreground">{rupees(s.released)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">UC submitted</p>
                      <p className="font-semibold text-foreground">{rupees(s.ucSubmitted)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unspent</p>
                      <p className={`font-semibold ${atRisk ? 'text-red-600' : 'text-foreground'}`}>
                        {rupees(s.unspent)} ({unspentPct}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
              <SelectTrigger className="sm:w-64"><SelectValue placeholder="Fund source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All sources</SelectItem>
                {sources?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={(v) => { setStage(v); setPage(1); }}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All stages</SelectItem>
                {FUND_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {worksLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !works?.data.length ? (
            <EmptyState title="No works" description="Recommend a work under a fund source to begin tracking." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Estimated</TableHead>
                      <TableHead className="text-right">Released</TableHead>
                      <TableHead>Sanction No</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {works.data.map((w) => {
                      const nxt = nextStage(w.stage);
                      return (
                        <TableRow key={w.id}>
                          <TableCell>
                            <p className="font-medium">{w.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {[w.mandal?.name, w.village?.name].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm">{w.fundSource?.name ?? '—'}</TableCell>
                          <TableCell><StageBadge stage={w.stage} /></TableCell>
                          <TableCell className="text-right">{rupees(Number(w.estimatedCost))}</TableCell>
                          <TableCell className="text-right">{rupees(Number(w.releasedAmount))}</TableCell>
                          <TableCell className="text-sm">{w.sanctionNo ?? '—'}</TableCell>
                          <TableCell className="text-right">
                            {nxt ? (
                              <Button variant="outline" size="sm" onClick={() => setAdvancing(w)}>
                                {nxt === 'UCSubmitted' ? 'Submit UC' : nxt} <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Done</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {works.meta && (
                <Pagination page={works.meta.page} totalPages={works.meta.totalPages} total={works.meta.total} onPage={setPage} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <SourceDialog open={sourceDialog} onOpenChange={setSourceDialog} onSaved={invalidate} />
      <WorkDialog open={workDialog} onOpenChange={setWorkDialog} onSaved={invalidate} sources={sources ?? []} />
      <AdvanceDialog work={advancing} onOpenChange={(o) => !o && setAdvancing(null)} onSaved={invalidate} />
    </>
  );
}

function SourceDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({ name: '', type: 'MPLADS', financialYear: '', allocated: '' });
  React.useEffect(() => {
    if (open) setForm({ name: '', type: 'MPLADS', financialYear: '', allocated: '' });
  }, [open]);
  const mutation = useMutation({
    mutationFn: () =>
      createFundSource({
        name: form.name,
        type: form.type || undefined,
        financialYear: form.financialYear,
        allocated: form.allocated ? Number(form.allocated) : undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Fund source created', variant: 'success' });
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>New fund source</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="MPLADS 2026-27" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['MPLADS', 'CDP', 'Other'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Financial year *</Label>
                <Input value={form.financialYear} onChange={(e) => setForm((f) => ({ ...f, financialYear: e.target.value }))} placeholder="2026-27" />
              </div>
              <div className="space-y-1.5">
                <Label>Allocated (₹)</Label>
                <Input type="number" value={form.allocated} onChange={(e) => setForm((f) => ({ ...f, allocated: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              disabled={form.name.trim().length < 3 || !form.financialYear.trim() || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Saving…' : 'Create source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}

function WorkDialog({
  open,
  onOpenChange,
  onSaved,
  sources,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  sources: FundSourceOption[];
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({ fundSourceId: '', title: '', estimatedCost: '', notes: '' });
  React.useEffect(() => {
    if (open) setForm({ fundSourceId: sources[0]?.id ?? '', title: '', estimatedCost: '', notes: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const mutation = useMutation({
    mutationFn: () =>
      createFundWork({
        fundSourceId: form.fundSourceId,
        title: form.title,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Work recommended', variant: 'success' });
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recommend new work</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Fund source *</Label>
              <Select value={form.fundSourceId} onValueChange={(v) => setForm((f) => ({ ...f, fundSourceId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {sources?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Work title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="CC road from bus stand to school" />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated cost (₹)</Label>
              <Input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              disabled={!form.fundSourceId || form.title.trim().length < 3 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Saving…' : 'Recommend work'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}

function AdvanceDialog({ work, onOpenChange, onSaved }: { work: FundWork | null; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { toast } = useToast();
  const target = work ? nextStage(work.stage) : null;
  const [sanctionNo, setSanctionNo] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [reference, setReference] = React.useState('');
  React.useEffect(() => {
    setSanctionNo('');
    setAmount('');
    setReference('');
  }, [work?.id]);
  const mutation = useMutation({
    mutationFn: () =>
      advanceFundWorkStage(work!.id, {
        stage: target!,
        sanctionNo: sanctionNo || undefined,
        amount: amount ? Number(amount) : undefined,
        reference: reference || undefined,
      }),
    onSuccess: () => {
      toast({ title: `Moved to ${target}`, variant: 'success' });
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });
  return (
      <Dialog open={!!work && !!target} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance to {target === 'UCSubmitted' ? 'UC Submitted' : target}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{work?.title}</p>
          <div className="grid gap-4">
            {target === 'Sanctioned' && (
              <div className="space-y-1.5">
                <Label>Sanction number</Label>
                <Input value={sanctionNo} onChange={(e) => setSanctionNo(e.target.value)} placeholder="SANC/2026/123" />
              </div>
            )}
            {target === 'Released' && (
              <>
                <div className="space-y-1.5">
                  <Label>Installment amount (₹)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reference</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / PO number" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
