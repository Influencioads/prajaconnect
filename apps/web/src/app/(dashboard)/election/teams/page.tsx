'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { CampaignTeamType } from '@praja/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ElectionListShell } from '@/components/crm/election-views';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { fetchGeoOptions } from '@/lib/crm';
import { createElectionTeam, fetchElectionTeams } from '@/lib/election';

const ALL = '__all__';
const NONE = '__none__';
const TEAM_TYPES = Object.values(CampaignTeamType);

export default function ElectionTeamsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [type, setType] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  const [name, setName] = React.useState('');
  const [teamType, setTeamType] = React.useState<CampaignTeamType>(CampaignTeamType.Ground);
  const [description, setDescription] = React.useState('');
  const [mandalId, setMandalId] = React.useState(NONE);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, type]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    type: type === ALL ? undefined : type,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['election-teams', filters],
    queryFn: () => fetchElectionTeams(filters),
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });

  const createMut = useMutation({
    mutationFn: () =>
      createElectionTeam({
        name,
        type: teamType,
        description: description || undefined,
        mandalId: mandalId === NONE ? undefined : mandalId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-teams'] });
      toast({ title: 'Team created', variant: 'success' });
      setDialog(false);
      setName('');
      setDescription('');
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <ElectionListShell
      title="Campaign Teams"
      description="Mandal, booth, media and ground teams for election operations."
      actions={canEdit ? <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Create team</Button> : undefined}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search teams…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {TEAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No teams" description="Create campaign teams and assign members." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mandal</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Leader</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: {
                id: string; name: string; type: string;
                mandal?: { name: string } | null;
                _count?: { members: number };
                leaderCadre?: { name: string } | null;
              }) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-navy">{row.name}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.mandal?.name ?? '—'}</TableCell>
                  <TableCell>{row._count?.members ?? 0}</TableCell>
                  <TableCell>{row.leaderCadre?.name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create team</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={teamType} onValueChange={(v) => setTeamType(v as CampaignTeamType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mandal</Label>
              <Select value={mandalId} onValueChange={setMandalId}>
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
            <Button className="bg-gold text-navy hover:bg-gold/90" disabled={!name || createMut.isPending} onClick={() => createMut.mutate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ElectionListShell>
  );
}
