'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { CampaignWorkStatus, CampaignWorkType, ElectionWorkPriority } from '@praja/types';
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
import { ElectionListShell, ElectionTableLink } from '@/components/crm/election-views';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { fetchGeoOptions } from '@/lib/crm';
import { formatDate } from '@/lib/utils';
import { createElectionWork, fetchElectionWorks } from '@/lib/election';

const ALL = '__all__';
const NONE = '__none__';
const WORK_TYPES = Object.values(CampaignWorkType);
const WORK_STATUSES = Object.values(CampaignWorkStatus);
const PRIORITIES = Object.values(ElectionWorkPriority);

export default function ElectionWorksPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [type, setType] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [workType, setWorkType] = React.useState<CampaignWorkType>(CampaignWorkType.BannerInstallation);
  const [priority, setPriority] = React.useState<ElectionWorkPriority>(ElectionWorkPriority.Medium);
  const [deadline, setDeadline] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [formMandalId, setFormMandalId] = React.useState(NONE);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, status, type, mandalId]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    status: status === ALL ? undefined : status,
    type: type === ALL ? undefined : type,
    mandalId: mandalId === ALL ? undefined : mandalId,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['election-works', filters],
    queryFn: () => fetchElectionWorks(filters),
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });

  const createMut = useMutation({
    mutationFn: () =>
      createElectionWork({
        title,
        type: workType,
        priority,
        deadline: deadline || undefined,
        description: description || undefined,
        mandalId: formMandalId === NONE ? undefined : formMandalId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-works'] });
      toast({ title: 'Work created', variant: 'success' });
      setDialog(false);
      setTitle('');
      setDescription('');
      setDeadline('');
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <ElectionListShell
      title="Campaign Works"
      description="Track banners, meetings, door-to-door and booth committee tasks."
      actions={canEdit ? <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Add work</Button> : undefined}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search works…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All status</SelectItem>
            {WORK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {WORK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
        <EmptyState title="No works found" description="Add campaign work items to track progress." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Mandal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: {
                id: string; title: string; type: string; priority?: string; deadline?: string;
                mandal?: { name: string } | null; status: string;
              }) => (
                <TableRow key={row.id}>
                  <TableCell><ElectionTableLink href={`/election/works/${row.id}`}>{row.title}</ElectionTableLink></TableCell>
                  <TableCell className="text-sm">{row.type}</TableCell>
                  <TableCell>{row.priority ?? '—'}</TableCell>
                  <TableCell>{row.deadline ? formatDate(row.deadline) : '—'}</TableCell>
                  <TableCell>{row.mandal?.name ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add campaign work</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={workType} onValueChange={(v) => setWorkType(v as CampaignWorkType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WORK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as ElectionWorkPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mandal</Label>
              <Select value={formMandalId} onValueChange={setFormMandalId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button className="bg-gold text-navy hover:bg-gold/90" disabled={!title || createMut.isPending} onClick={() => createMut.mutate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ElectionListShell>
  );
}
