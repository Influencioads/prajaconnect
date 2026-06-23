'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Building2, Phone, ArrowDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import {
  fetchOfficials,
  fetchDepartments,
  fetchEscalation,
  createOfficial,
  updateOfficial,
  deleteOfficial,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Official,
  type Department,
} from '@/lib/crm';

const ALL = '__all__';
const NONE = '__none__';
const LEVELS = ['Booth', 'Village', 'Mandal', 'Constituency', 'District', 'State'];

export default function OfficialsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('officials'));
  const canDelete = accessLevel('officials') === 'full';

  return (
    <>
      <PageHeader
        title="Government Liaison"
        description="Officials directory, departments and grievance escalation matrix."
      />
      <Tabs defaultValue="officials">
        <TabsList>
          <TabsTrigger value="officials">Officials</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
        </TabsList>
        <TabsContent value="officials">
          <OfficialsTab canEdit={canEdit} canDelete={canDelete} />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentsTab canEdit={canEdit} canDelete={canDelete} />
        </TabsContent>
        <TabsContent value="escalation">
          <EscalationTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function OfficialsTab({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [level, setLevel] = React.useState(ALL);
  const [departmentId, setDepartmentId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Official | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, level, departmentId]);

  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    level: level === ALL ? undefined : level,
    departmentId: departmentId === ALL ? undefined : departmentId,
  };
  const { data, isLoading } = useQuery({
    queryKey: ['officials', filters],
    queryFn: () => fetchOfficials(filters),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteOfficial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['officials'] });
      toast({ title: 'Official removed', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search officials…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All levels</SelectItem>
              {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="sm:w-48"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {depts?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data?.data.length ? (
          <EmptyState title="No officials found" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Esc. Order</TableHead>
                  {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-semibold">{o.name}</TableCell>
                    <TableCell className="text-sm">{o.designation}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.department?.name ?? '—'}</TableCell>
                    <TableCell><Badge variant="muted">{o.level}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.mobile ?? '—'}</TableCell>
                    <TableCell className="text-sm">{o.escalationOrder}</TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => { setEditing(o); setOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Remove ${o.name}?`)) del.mutate(o.id); }}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
          </>
        )}
      </CardContent>
      <OfficialDialog open={open} onOpenChange={setOpen} official={editing} departments={depts ?? []} />
    </Card>
  );
}

function OfficialDialog({
  open,
  onOpenChange,
  official,
  departments,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  official: Official | null;
  departments: Department[];
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    name: '', designation: '', level: 'Mandal', mobile: '', email: '', office: '',
    jurisdiction: '', escalationOrder: '1', departmentId: '',
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: official?.name ?? '', designation: official?.designation ?? '',
        level: official?.level ?? 'Mandal', mobile: official?.mobile ?? '',
        email: official?.email ?? '', office: official?.office ?? '',
        jurisdiction: official?.jurisdiction ?? '',
        escalationOrder: String(official?.escalationOrder ?? 1),
        departmentId: official?.departmentId ?? '',
      });
    }
  }, [open, official]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name, designation: form.designation, level: form.level,
        mobile: form.mobile || undefined, email: form.email || undefined,
        office: form.office || undefined, jurisdiction: form.jurisdiction || undefined,
        escalationOrder: Number(form.escalationOrder) || 1,
        departmentId: form.departmentId || undefined,
      };
      return official ? updateOfficial(official.id, payload) : createOfficial(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['officials'] });
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast({ title: official ? 'Official updated' : 'Official added', variant: 'success' });
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const valid = form.name.trim().length >= 2 && form.designation.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{official ? 'Edit official' : 'Add official'}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Fld label="Name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Fld>
          <Fld label="Designation *"><Input value={form.designation} onChange={(e) => set('designation', e.target.value)} /></Fld>
          <Fld label="Level">
            <Select value={form.level} onValueChange={(v) => set('level', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Fld>
          <Fld label="Department">
            <Select value={form.departmentId || NONE} onValueChange={(v) => set('departmentId', v === NONE ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Fld>
          <Fld label="Mobile"><Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} /></Fld>
          <Fld label="Email"><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></Fld>
          <Fld label="Office"><Input value={form.office} onChange={(e) => set('office', e.target.value)} /></Fld>
          <Fld label="Escalation order">
            <Input type="number" min={1} value={form.escalationOrder} onChange={(e) => set('escalationOrder', e.target.value)} />
          </Fld>
          <div className="sm:col-span-2">
            <Fld label="Jurisdiction"><Input value={form.jurisdiction} onChange={(e) => set('jurisdiction', e.target.value)} /></Fld>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mut.isPending} onClick={() => mut.mutate()}>{mut.isPending ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DepartmentsTab({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [form, setForm] = React.useState({ name: '', category: '', description: '', slaHours: '72' });

  React.useEffect(() => {
    if (open) setForm({
      name: editing?.name ?? '', category: editing?.category ?? '',
      description: editing?.description ?? '', slaHours: String(editing?.slaHours ?? 72),
    });
  }, [open, editing]);

  const del = useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast({ title: 'Department removed', variant: 'success' }); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });
  const save = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, category: form.category || undefined, description: form.description || undefined, slaHours: Number(form.slaHours) || 72 };
      return editing ? updateDepartment(editing.id, payload) : createDepartment(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast({ title: 'Saved', variant: 'success' }); setOpen(false); },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Departments</CardTitle>
        {canEdit && <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add</Button>}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {data?.map((d) => (
          <div key={d.id} className="flex items-start justify-between rounded-lg border p-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <p className="font-semibold">{d.name}</p>
              </div>
              {d.category && <p className="text-xs text-muted-foreground">{d.category}</p>}
              <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                <Badge variant="muted">{d.slaHours}h SLA</Badge>
                <Badge variant="muted">{d._count?.officials ?? 0} officials</Badge>
                <Badge variant="muted">{d._count?.grievances ?? 0} grievances</Badge>
              </div>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex gap-1">
                {canEdit && <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Remove ${d.name}?`)) del.mutate(d.id); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
              </div>
            )}
          </div>
        ))}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit department' : 'Add department'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Fld label="Name *"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Fld>
            <Fld label="Category"><Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></Fld>
            <Fld label="SLA hours"><Input type="number" value={form.slaHours} onChange={(e) => setForm((f) => ({ ...f, slaHours: e.target.value }))} /></Fld>
            <Fld label="Description"><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Fld>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={form.name.trim().length < 2 || save.isPending} onClick={() => save.mutate()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function EscalationTab() {
  const { data, isLoading } = useQuery({ queryKey: ['escalation'], queryFn: fetchEscalation });
  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!data?.length) return <EmptyState title="No escalation data" />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((d) => (
        <Card key={d.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{d.name}</span>
              <Badge variant="muted">{d.slaHours}h SLA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.levels.length ? (
              <ol className="space-y-2">
                {d.levels.map((o, i) => (
                  <li key={o.id}>
                    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{o.designation} · {o.level}</p>
                      </div>
                      {o.mobile && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {o.mobile}
                        </span>
                      )}
                    </div>
                    {i < d.levels.length - 1 && (
                      <div className="flex justify-center py-0.5 text-muted-foreground">
                        <ArrowDown className="h-3 w-3" />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No officials mapped.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
