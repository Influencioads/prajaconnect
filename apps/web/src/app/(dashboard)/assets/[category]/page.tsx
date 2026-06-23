'use client';

import * as React from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Download, Upload, Boxes } from 'lucide-react';
import { AssetStatus, AssetCondition } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { useToast } from '@/components/ui/toast';
import { AssetFormDialog } from '@/components/crm/asset-form-dialog';
import { configBySlug, readAnalytic } from '@/lib/asset-config';
import {
  deleteAsset,
  downloadAssetsCsv,
  fetchAssets,
  fetchAssetStats,
  fetchGeoOptions,
  importAssetsCsv,
  type AssetDetail,
  type AssetListItem,
} from '@/lib/crm';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';

const ALL = '__all__';
const STATUSES = Object.values(AssetStatus);
const CONDITIONS = Object.values(AssetCondition);

export default function AssetCategoryPage() {
  const params = useParams<{ category: string }>();
  const config = configBySlug(params.category);
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const level = accessLevel('assets');
  const canEdit = level === 'edit' || level === 'full';
  const canDelete = level === 'full';

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [condition, setCondition] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);
  const [editing, setEditing] = React.useState<AssetDetail | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });
  const { data: stats } = useQuery({
    queryKey: ['asset-stats', config?.category],
    queryFn: () => fetchAssetStats(config?.category),
    enabled: !!config,
  });
  const { data, isLoading } = useQuery({
    queryKey: ['assets', config?.category, debounced, status, condition, mandalId, page],
    queryFn: () =>
      fetchAssets({
        category: config?.category,
        search: debounced || undefined,
        status: status === ALL ? undefined : status,
        condition: condition === ALL ? undefined : condition,
        mandalId: mandalId === ALL ? undefined : mandalId,
        page,
        limit: 20,
      }),
    enabled: !!config,
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      toast({ title: 'Asset deleted', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  const importMut = useMutation({
    mutationFn: (csv: string) => importAssetsCsv(csv, config?.category),
    onSuccess: (res: { created: number; failed: number }) => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      toast({ title: `Imported ${res.created} assets`, description: res.failed ? `${res.failed} rows skipped` : undefined, variant: 'success' });
    },
    onError: (err) => toast({ title: 'Import failed', description: apiError(err), variant: 'error' }),
  });

  if (!config) {
    notFound();
    return null;
  }

  const openCreate = () => {
    setEditing(null);
    setDialog(true);
  };

  return (
    <>
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadAssetsCsv(config.category)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            {canEdit && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) importMut.mutate(await file.text());
                    e.target.value = '';
                  }}
                />
                <Button variant="outline" size="sm" disabled={importMut.isPending} onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Import CSV
                </Button>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New {config.singular}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label={`Total ${config.label}`} value={stats?.total ?? 0} icon={config.icon} accent="bg-blue-100 text-blue-700" />
        {config.analytics.slice(0, 3).map((c) => (
          <KpiCard key={c.key} label={c.label} value={readAnalytic(stats, c)} icon={Boxes} accent="bg-emerald-100 text-emerald-700" />
        ))}
        {config.analytics.length < 3 &&
          Array.from({ length: 3 - config.analytics.length }).map((_, i) => {
            const entries = Object.entries(stats?.byStatus ?? {});
            const e = entries[i];
            return e ? (
              <KpiCard key={e[0]} label={e[0]} value={e[1]} icon={Boxes} accent="bg-amber-100 text-amber-700" />
            ) : null;
          })}
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder={`Search ${config.label.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="lg:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {config.showCondition && (
              <Select value={condition} onValueChange={(v) => { setCondition(v); setPage(1); }}>
                <SelectTrigger className="lg:w-40"><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All conditions</SelectItem>
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={mandalId} onValueChange={(v) => { setMandalId(v); setPage(1); }}>
              <SelectTrigger className="lg:w-44"><SelectValue placeholder="Mandal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All mandals</SelectItem>
                {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title={`No ${config.label.toLowerCase()} found`} description={`Add a ${config.singular.toLowerCase()} to get started.`} icon={config.icon} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-3 font-semibold">Name</th>
                      <th className="pb-2 pr-3 font-semibold">Details</th>
                      <th className="pb-2 pr-3 font-semibold">Location</th>
                      <th className="pb-2 pr-3 font-semibold">Status</th>
                      <th className="pb-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((a: AssetListItem) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2.5 pr-3">
                          <Link href={`/assets/${config.slug}/${a.id}`} className="font-medium text-foreground hover:underline">
                            {a.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{a.code}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{config.primaryInfo?.(a) ?? '—'}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          {a.mandal?.name ?? '—'}{a.village?.name ? ` · ${a.village.name}` : ''}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-1">
                            <StatusBadge status={a.status} />
                            {a.condition && <StatusBadge status={a.condition} />}
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/assets/${config.slug}/${a.id}`)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Delete ${a.name}?`)) del.mutate(a.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.meta && (
                <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AssetFormDialog open={dialog} onOpenChange={setDialog} config={config} asset={editing} />
    </>
  );
}
