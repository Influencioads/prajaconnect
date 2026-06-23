'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { ElectionVehicleStatus, ElectionVehicleType } from '@praja/types';
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
import { createElectionVehicle, fetchElectionVehicles } from '@/lib/election';

const ALL = '__all__';
const VEHICLE_TYPES = Object.values(ElectionVehicleType);
const VEHICLE_STATUSES = Object.values(ElectionVehicleStatus);

export default function ElectionVehiclesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState(ALL);
  const [status, setStatus] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState(false);

  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [formVehicleType, setFormVehicleType] = React.useState<ElectionVehicleType>(ElectionVehicleType.CampaignVehicle);
  const [formStatus, setFormStatus] = React.useState<ElectionVehicleStatus>(ElectionVehicleStatus.Available);
  const [ownerName, setOwnerName] = React.useState('');
  const [driverName, setDriverName] = React.useState('');
  const [driverMobile, setDriverMobile] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, vehicleType, status]);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    vehicleType: vehicleType === ALL ? undefined : vehicleType,
    status: status === ALL ? undefined : status,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['election-vehicles', filters],
    queryFn: () => fetchElectionVehicles(filters),
  });

  const resetForm = () => {
    setVehicleNumber('');
    setFormVehicleType(ElectionVehicleType.CampaignVehicle);
    setFormStatus(ElectionVehicleStatus.Available);
    setOwnerName('');
    setDriverName('');
    setDriverMobile('');
    setNotes('');
  };

  const createMut = useMutation({
    mutationFn: () =>
      createElectionVehicle({
        vehicleNumber: vehicleNumber.trim(),
        vehicleType: formVehicleType,
        status: formStatus,
        ownerName: ownerName.trim() || undefined,
        driverName: driverName.trim() || undefined,
        driverMobile: driverMobile.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-vehicles'] });
      qc.invalidateQueries({ queryKey: ['election-dashboard'] });
      toast({ title: 'Vehicle added', variant: 'success' });
      setDialog(false);
      resetForm();
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <ElectionListShell
      title="Campaign Vehicles"
      description="Fleet registry, assignments, trips and fuel logs."
      actions={
        canEdit ? (
          <Button onClick={() => setDialog(true)}>
            <Plus className="h-4 w-4" /> Add vehicle
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search vehicles…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={vehicleType} onValueChange={setVehicleType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All status</SelectItem>
            {VEHICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
        <EmptyState title="No vehicles" description="Register campaign vehicles to track usage." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: {
                id: string; vehicleNumber: string; vehicleType: string;
                driverName?: string | null; ownerName?: string | null; status: string;
              }) => (
                <TableRow key={row.id}>
                  <TableCell><ElectionTableLink href={`/election/vehicles/${row.id}`}>{row.vehicleNumber}</ElectionTableLink></TableCell>
                  <TableCell>{row.vehicleType}</TableCell>
                  <TableCell>{row.driverName ?? '—'}</TableCell>
                  <TableCell>{row.ownerName ?? '—'}</TableCell>
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
          <DialogHeader><DialogTitle>Add vehicle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle number</Label>
              <Input
                placeholder="e.g. AP39TD1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formVehicleType} onValueChange={(v) => setFormVehicleType(v as ElectionVehicleType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ElectionVehicleStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VEHICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Driver name</Label>
                <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Driver mobile</Label>
                <Input value={driverMobile} onChange={(e) => setDriverMobile(e.target.value)} placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Party office, vendor, etc." />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button
              className="bg-gold text-navy hover:bg-gold/90"
              disabled={!vehicleNumber.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ElectionListShell>
  );
}
