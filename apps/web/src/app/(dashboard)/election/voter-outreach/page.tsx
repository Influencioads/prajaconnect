'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { OutreachChannel, VoterStance } from '@praja/types';
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
import { formatDate } from '@/lib/utils';
import { createVoterOutreach, fetchVoterOutreach } from '@/lib/election';

const ALL = '__all__';
const NONE = '__none__';
const CHANNELS = Object.values(OutreachChannel);
const STANCES = Object.values(VoterStance);

export default function VoterOutreachPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [channel, setChannel] = React.useState(ALL);
  const [stance, setStance] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  const [contactName, setContactName] = React.useState('');
  const [contactMobile, setContactMobile] = React.useState('');
  const [formChannel, setFormChannel] = React.useState<OutreachChannel>(OutreachChannel.DoorToDoor);
  const [formStance, setFormStance] = React.useState<VoterStance>(VoterStance.Unknown);
  const [mandalId, setMandalId] = React.useState(NONE);
  const [boothId, setBoothId] = React.useState(NONE);
  const [notes, setNotes] = React.useState('');
  const [followUpRequired, setFollowUpRequired] = React.useState(false);
  const [isKeyVoter, setIsKeyVoter] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, channel, stance]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    channel: channel === ALL ? undefined : channel,
    stance: stance === ALL ? undefined : stance,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['election-voter-outreach', filters],
    queryFn: () => fetchVoterOutreach(filters),
  });
  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });

  const booths = React.useMemo(() => {
    if (!geo || mandalId === NONE) return geo?.booths ?? [];
    const villageIds = new Set(geo.villages.filter((v) => v.mandalId === mandalId).map((v) => v.id));
    return geo.booths.filter((b) => villageIds.has(b.villageId));
  }, [geo, mandalId]);

  const createMut = useMutation({
    mutationFn: () =>
      createVoterOutreach({
        contactName,
        contactMobile: contactMobile || undefined,
        channel: formChannel,
        stance: formStance,
        mandalId: mandalId === NONE ? undefined : mandalId,
        boothId: boothId === NONE ? undefined : boothId,
        notes: notes || undefined,
        followUpRequired,
        isKeyVoter,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-voter-outreach'] });
      toast({ title: 'Outreach recorded', variant: 'success' });
      setDialog(false);
      setContactName('');
      setContactMobile('');
      setNotes('');
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <ElectionListShell
      title="Voter Outreach"
      description="Door-to-door, calls and meetings — track voter sentiment."
      actions={canEdit ? <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Add outreach</Button> : undefined}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search contacts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All channels</SelectItem>
            {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stance} onValueChange={setStance}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Stance" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All stances</SelectItem>
            {STANCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No outreach records" description="Log voter contacts to build sentiment maps." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Stance</TableHead>
                <TableHead>Mandal</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: {
                id: string; contactName?: string | null; contactMobile?: string | null;
                channel?: string; stance?: string; mandal?: { name: string } | null; createdAt: string;
              }) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium text-navy">{row.contactName ?? '—'}</p>
                    {row.contactMobile && <p className="text-xs text-muted-foreground">{row.contactMobile}</p>}
                  </TableCell>
                  <TableCell>{row.channel ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={row.stance ?? 'Unknown'} /></TableCell>
                  <TableCell>{row.mandal?.name ?? '—'}</TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record voter outreach</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact name</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={contactMobile} onChange={(e) => setContactMobile(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={formChannel} onValueChange={(v) => setFormChannel(v as OutreachChannel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stance</Label>
                <Select value={formStance} onValueChange={(v) => setFormStance(v as VoterStance)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STANCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mandal</Label>
                <Select value={mandalId} onValueChange={(v) => { setMandalId(v); setBoothId(NONE); }}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {geo?.mandals.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Booth</Label>
                <Select value={boothId} onValueChange={setBoothId} disabled={mandalId === NONE}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {booths.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={followUpRequired} onChange={(e) => setFollowUpRequired(e.target.checked)} />
                Follow-up required
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isKeyVoter} onChange={(e) => setIsKeyVoter(e.target.checked)} />
                Key voter
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button className="bg-gold text-navy hover:bg-gold/90" disabled={!contactName || createMut.isPending} onClick={() => createMut.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ElectionListShell>
  );
}
