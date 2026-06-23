'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { HardHat, Wallet, TrendingUp, Banknote, Plus, Search, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ProjectFormDialog } from '@/components/crm/project-form-dialog';
import { fetchProjects, fetchProjectStats, type ProjectDetail } from '@/lib/crm';
import { formatNumber } from '@/lib/utils';

const ALL = '__all__';
const STATUSES = ['Planning', 'InProgress', 'Completed', 'Delayed'];

function rupees(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${formatNumber(n)}`;
}

export default function ProjectsPage() {
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);
  const [editing, setEditing] = React.useState<ProjectDetail | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats } = useQuery({ queryKey: ['project-stats'], queryFn: fetchProjectStats });
  const { data, isLoading } = useQuery({
    queryKey: ['projects', debounced, status, page],
    queryFn: () =>
      fetchProjects({
        search: debounced || undefined,
        status: status === ALL ? undefined : status,
        page,
        limit: 20,
      }),
  });

  const openCreate = () => {
    setEditing(null);
    setDialog(true);
  };
  const openEdit = (p: ProjectDetail) => {
    setEditing(p);
    setDialog(true);
  };

  return (
    <>
      <PageHeader
        title="Development Projects"
        description="Track public works, budgets and execution progress."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Projects" value={stats?.total ?? 0} icon={HardHat} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Total budget" value={rupees(stats?.totalBudget ?? 0)} icon={Wallet} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Spent" value={rupees(stats?.totalSpent ?? 0)} icon={Banknote} accent="bg-emerald-100 text-emerald-700" />
        <KpiCard label="Avg progress" value={`${stats?.avgProgress ?? 0}%`} icon={TrendingUp} accent="bg-purple-100 text-purple-700" />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No projects found" description="Add a development project to start tracking." />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.data.map((p) => {
                  const pct = Math.min(100, Math.max(0, p.progressPct));
                  const utilization = p.budget ? Math.round((p.spent / p.budget) * 100) : 0;
                  return (
                    <Card key={p.id}>
                      <CardContent className="space-y-3 pt-5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display font-bold">{p.name}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="muted">{p.category ?? '—'}</Badge>
                              {p.mandal && <span className="text-xs text-muted-foreground">{p.mandal.name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusBadge status={p.status} />
                            <Button variant="ghost" size="sm" onClick={() => openEdit(p as ProjectDetail)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{pct}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${p.status === 'Delayed' ? 'bg-red-500' : 'bg-navy'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-semibold text-foreground">{rupees(p.budget)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Spent</p>
                            <p className="font-semibold text-foreground">{rupees(p.spent)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Utilization</p>
                            <p className="font-semibold text-foreground">{utilization}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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

      <ProjectFormDialog open={dialog} onOpenChange={setDialog} project={editing} />
    </>
  );
}
