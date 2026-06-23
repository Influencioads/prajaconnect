'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users2, Network } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { CadreFormDialog } from '@/components/crm/cadre-form-dialog';
import { CadreHierarchy } from '@/components/crm/cadre-hierarchy';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import {
  fetchCadre,
  fetchCadreStats,
  fetchGeoOptions,
  deleteCadre,
  type CadreListItem,
} from '@/lib/crm';

const ALL = '__all__';

export default function CadrePage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('cadre'));
  const canDelete = accessLevel('cadre') === 'full';
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [level, setLevel] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CadreListItem | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => setPage(1), [debounced, status, level, mandalId]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status === ALL ? undefined : status,
    level: level === ALL ? undefined : level,
    mandalId: mandalId === ALL ? undefined : mandalId,
  };

  const { data: stats } = useQuery({ queryKey: ['cadre-stats'], queryFn: fetchCadreStats });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });
  const { data, isLoading } = useQuery({
    queryKey: ['cadre', filters],
    queryFn: () => fetchCadre(filters),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCadre(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cadre'] });
      qc.invalidateQueries({ queryKey: ['cadre-stats'] });
      qc.invalidateQueries({ queryKey: ['cadre-hierarchy'] });
      toast({ title: 'Cadre removed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Delete failed', description: apiError(err), variant: 'error' }),
  });

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: CadreListItem) => {
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Cadre Management"
        description="Party karyakartas, booth coordinators and the field hierarchy."
        actions={
          canEdit ? (
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add cadre
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Cadre" value={stats?.total ?? 0} icon={Users2} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Active" value={stats?.active ?? 0} icon={Users2} accent="bg-green-100 text-green-700" />
        <KpiCard label="On Leave" value={stats?.onLeave ?? 0} icon={Users2} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Inactive" value={stats?.inactive ?? 0} icon={Users2} accent="bg-red-100 text-red-700" />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <Users2 className="mr-1.5 h-4 w-4" /> List
          </TabsTrigger>
          <TabsTrigger value="hierarchy">
            <Network className="mr-1.5 h-4 w-4" /> Hierarchy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by name, mobile, designation…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <FilterSelect value={status} onChange={setStatus} placeholder="Status" options={['Active', 'OnLeave', 'Inactive']} />
                <FilterSelect
                  value={level}
                  onChange={setLevel}
                  placeholder="Level"
                  options={['Booth', 'Village', 'Mandal', 'Constituency', 'District', 'State']}
                />
                <FilterSelect
                  value={mandalId}
                  onChange={setMandalId}
                  placeholder="Mandal"
                  options={(geo?.mandals ?? []).map((m) => ({ value: m.id, label: m.name }))}
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : !data?.data.length ? (
                <EmptyState title="No cadre found" description="Try adjusting filters or add a new cadre." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Mandal / Booth</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Link href={`/cadre/${c.id}`} className="font-semibold text-foreground hover:text-primary">
                              {c.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{c.mobile}</p>
                          </TableCell>
                          <TableCell className="text-sm">{c.designation}</TableCell>
                          <TableCell>
                            <Badge variant="muted">{c.level}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {c.mandal?.name ?? '—'}
                            {c.booth ? ` · #${c.booth.number}` : ''}
                          </TableCell>
                          <TableCell className="text-sm">{c._count.children}</TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {canEdit && (
                                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Remove ${c.name}?`)) del.mutate(c.id);
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
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardContent className="pt-6">
              <CadreHierarchy />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CadreFormDialog open={formOpen} onOpenChange={setFormOpen} cadre={editing} />
    </>
  );
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
          const value = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
