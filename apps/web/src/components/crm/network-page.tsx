'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Download, Upload, Users2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { NetworkFormDialog } from '@/components/crm/network-form-dialog';
import { CsvImportDialog } from '@/components/crm/csv-import-dialog';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import {
  fetchNetworkList,
  fetchNetworkStats,
  fetchGeoOptions,
  deleteNetworkRecord,
  exportNetworkCsv,
  type NetworkRecord,
} from '@/lib/crm';
import { formatNumber } from '@/lib/utils';
import type { NetworkViewConfig } from '@/lib/network-config';

const ALL = '__all__';

export function NetworkPage({ config }: { config: NetworkViewConfig }) {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('committees'));
  const canDelete = accessLevel('committees') === 'full';
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [extra, setExtra] = React.useState<Record<string, string>>({});
  const [page, setPage] = React.useState(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<NetworkRecord | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => setPage(1), [debounced, status, mandalId, extra, config.key]);

  const extraParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(extra)) if (v && v !== ALL) extraParams[k] = v;

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status === ALL ? undefined : status,
    mandalId: mandalId === ALL ? undefined : mandalId,
    category: config.category,
    ...extraParams,
  };

  const { data: stats } = useQuery({
    queryKey: ['network-stats', config.key, { mandalId, status, ...extraParams }],
    queryFn: () => fetchNetworkStats(config.resource, { mandalId: mandalId === ALL ? undefined : mandalId, category: config.category, ...extraParams }),
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });
  const { data, isLoading } = useQuery({
    queryKey: ['network', config.key, filters],
    queryFn: () => fetchNetworkList(config.resource, filters),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteNetworkRecord(config.resource, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['network', config.key] });
      qc.invalidateQueries({ queryKey: ['network-stats', config.key] });
      qc.invalidateQueries({ queryKey: ['committee-analytics'] });
      toast({ title: 'Member removed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Delete failed', description: apiError(err), variant: 'error' }),
  });

  const onExport = async () => {
    try {
      await exportNetworkCsv(config.resource, {
        status: status === ALL ? undefined : status,
        mandalId: mandalId === ALL ? undefined : mandalId,
        category: config.category,
        ...extraParams,
      });
    } catch (err) {
      toast({ title: 'Export failed', description: apiError(err), variant: 'error' });
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: NetworkRecord) => {
    setEditing(r);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" /> Import
              </Button>
            )}
            {canEdit && (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add member
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total" value={stats?.total ?? 0} icon={Users2} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Active" value={stats?.active ?? 0} icon={Users2} accent="bg-green-100 text-green-700" />
        <KpiCard label="Inactive" value={stats?.inactive ?? 0} icon={Users2} accent="bg-red-100 text-red-700" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, mobile, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <FilterSelect value={status} onChange={setStatus} placeholder="Status" options={['Active', 'Inactive']} />
            <FilterSelect
              value={mandalId}
              onChange={setMandalId}
              placeholder="Mandal"
              options={(geo?.mandals ?? []).map((m) => ({ value: m.id, label: m.name }))}
            />
            {(config.filters ?? []).map((f) => (
              <FilterSelect
                key={f.key}
                value={extra[f.key] ?? ALL}
                onChange={(v) => setExtra((e) => ({ ...e, [f.key]: v }))}
                placeholder={f.label}
                options={f.options}
              />
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : !data?.data.length ? (
            <EmptyState title="No records found" description="Try adjusting filters or add a new member." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Mandal</TableHead>
                      {config.extraColumns.map((c) => (
                        <TableHead key={c.key}>{c.label}</TableHead>
                      ))}
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Link
                            href={`/committees/${config.key}/${r.id}`}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {r.fullName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{r.mobile}</p>
                        </TableCell>
                        <TableCell className="text-sm">{r.designation ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.mandal?.name ?? '—'}</TableCell>
                        {config.extraColumns.map((c) => (
                          <TableCell key={c.key} className="text-sm">
                            {renderCell(r[c.key], c.kind)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canEdit && (
                              <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Remove ${r.fullName}?`)) del.mutate(r.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                onPage={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <NetworkFormDialog open={formOpen} onOpenChange={setFormOpen} config={config} record={editing} />
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        resource={config.resource}
        invalidateKey={config.key}
      />
    </>
  );
}

function renderCell(value: unknown, kind?: 'badge' | 'number' | 'text') {
  if (value === null || value === undefined || value === '') return '—';
  if (kind === 'badge') return <Badge variant="muted">{String(value)}</Badge>;
  if (kind === 'number') return formatNumber(value as number);
  return String(value);
}

type Option = string | { value: string; label: string };

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Option[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="sm:w-44">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
