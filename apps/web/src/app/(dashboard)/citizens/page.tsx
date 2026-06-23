'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users, UserCheck, Home } from 'lucide-react';
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
import { CitizenFormDialog } from '@/components/crm/citizen-form-dialog';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import {
  fetchCitizens,
  fetchCitizenStats,
  fetchGeoOptions,
  deleteCitizen,
  type CitizenListItem,
} from '@/lib/crm';

const ALL = '__all__';

export default function CitizensPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('citizens'));
  const canDelete = accessLevel('citizens') === 'full';
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [gender, setGender] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CitizenListItem | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => setPage(1), [debounced, status, gender, mandalId]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status === ALL ? undefined : status,
    gender: gender === ALL ? undefined : gender,
    mandalId: mandalId === ALL ? undefined : mandalId,
  };

  const { data: stats } = useQuery({ queryKey: ['citizen-stats'], queryFn: fetchCitizenStats });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });
  const { data, isLoading } = useQuery({
    queryKey: ['citizens', filters],
    queryFn: () => fetchCitizens(filters),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCitizen(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citizens'] });
      qc.invalidateQueries({ queryKey: ['citizen-stats'] });
      toast({ title: 'Citizen removed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Delete failed', description: apiError(err), variant: 'error' }),
  });

  return (
    <>
      <PageHeader
        title="Citizen Database"
        description="Voter and household records across the constituency."
        actions={
          canEdit ? (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Add citizen
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Citizens" value={stats?.total ?? 0} icon={Users} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Active" value={stats?.active ?? 0} icon={UserCheck} accent="bg-green-100 text-green-700" />
        <KpiCard
          label="Male / Female"
          value={`${stats?.male ?? 0} / ${stats?.female ?? 0}`}
          icon={Users}
          accent="bg-purple-100 text-purple-700"
        />
        <KpiCard label="Families" value={stats?.families ?? 0} icon={Home} accent="bg-amber-100 text-amber-700" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, mobile, voter ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <FilterSelect value={status} onChange={setStatus} placeholder="Status" options={['Active', 'Inactive', 'Deceased', 'Migrated']} />
            <FilterSelect value={gender} onChange={setGender} placeholder="Gender" options={['Male', 'Female', 'Other']} />
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
            <EmptyState title="No citizens found" description="Try adjusting filters or add a new citizen." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender / Age</TableHead>
                    <TableHead>Voter ID</TableHead>
                    <TableHead>Mandal / Village</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/citizens/${c.id}`} className="font-semibold text-foreground hover:text-primary">
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{c.mobile ?? '—'}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.gender ?? '—'}
                        {c.age ? ` · ${c.age}y` : ''}
                      </TableCell>
                      <TableCell className="text-sm">{c.voterId ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.mandal?.name ?? '—'}
                        {c.village ? ` · ${c.village.name}` : ''}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.family ? (
                          <span className="inline-flex items-center gap-1">
                            {c.family.headName}
                            {c.isFamilyHead && <Badge variant="gold">Head</Badge>}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setFormOpen(true); }}>
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

      <CitizenFormDialog open={formOpen} onOpenChange={setFormOpen} citizen={editing} />
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
          const val = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return (
            <SelectItem key={val} value={val}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
