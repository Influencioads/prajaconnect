'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { addVehicleTrip, fetchElectionVehicle, fetchVehicleTrips } from '@/lib/election';

export default function VehicleTripsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [page, setPage] = React.useState(1);
  const [tripDate, setTripDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [startKm, setStartKm] = React.useState('');
  const [endKm, setEndKm] = React.useState('');
  const [route, setRoute] = React.useState('');
  const [driverName, setDriverName] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const { data: vehicle } = useQuery({
    queryKey: ['election-vehicle', id],
    queryFn: () => fetchElectionVehicle(id),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['election-vehicle-trips', id, page],
    queryFn: () => fetchVehicleTrips(id, page),
  });

  const addMut = useMutation({
    mutationFn: () =>
      addVehicleTrip(id, {
        tripDate,
        startKm: Number(startKm),
        endKm: endKm ? Number(endKm) : undefined,
        route: route || undefined,
        driverName: driverName || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-vehicle-trips', id] });
      toast({ title: 'Trip logged', variant: 'success' });
      setStartKm('');
      setEndKm('');
      setRoute('');
      setNotes('');
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/election/vehicles/${id}`}><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      <PageHeader
        title="Trip logs"
        description={vehicle ? `${vehicle.vehicleNumber} · ${vehicle.vehicleType}` : 'Vehicle trips'}
      />

      {canEdit && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Add trip</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Start km</Label>
                <Input type="number" min={0} value={startKm} onChange={(e) => setStartKm(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End km</Label>
                <Input type="number" min={0} value={endKm} onChange={(e) => setEndKm(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={route} onChange={(e) => setRoute(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <Button
              className="bg-gold text-navy hover:bg-gold/90"
              disabled={!startKm || addMut.isPending}
              onClick={() => addMut.mutate()}
            >
              Log trip
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
            <EmptyState title="No trips logged" description="Record vehicle trips to track mileage." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Start km</TableHead>
                    <TableHead>End km</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Driver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((row: {
                    id: string; tripDate?: string; startKm: number; endKm?: number | null;
                    route?: string | null; driverName?: string | null;
                  }) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.tripDate ? formatDate(row.tripDate) : '—'}</TableCell>
                      <TableCell>{row.startKm}</TableCell>
                      <TableCell>{row.endKm ?? '—'}</TableCell>
                      <TableCell>{row.endKm != null ? row.endKm - row.startKm : '—'}</TableCell>
                      <TableCell>{row.route ?? '—'}</TableCell>
                      <TableCell>{row.driverName ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
