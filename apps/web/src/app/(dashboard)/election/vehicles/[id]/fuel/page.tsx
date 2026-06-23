'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
import { addVehicleFuel, fetchElectionVehicle, fetchVehicleFuel } from '@/lib/election';

export default function VehicleFuelPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('election'));

  const [page, setPage] = React.useState(1);
  const [fuelDate, setFuelDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [liters, setLiters] = React.useState('');
  const [cost, setCost] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [createExpense, setCreateExpense] = React.useState(false);

  const { data: vehicle } = useQuery({
    queryKey: ['election-vehicle', id],
    queryFn: () => fetchElectionVehicle(id),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['election-vehicle-fuel', id, page],
    queryFn: () => fetchVehicleFuel(id, page),
  });

  const addMut = useMutation({
    mutationFn: () =>
      addVehicleFuel(id, {
        fuelDate,
        liters: liters ? Number(liters) : undefined,
        cost: Number(cost),
        notes: notes || undefined,
        createExpense,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-vehicle-fuel', id] });
      toast({ title: 'Fuel logged', variant: 'success' });
      setLiters('');
      setCost('');
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
        title="Fuel logs"
        description={vehicle ? `${vehicle.vehicleNumber} · ${vehicle.vehicleType}` : 'Vehicle fuel'}
      />

      {canEdit && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Add fuel entry</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={fuelDate} onChange={(e) => setFuelDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Liters</Label>
                <Input type="number" min={0} step="0.1" value={liters} onChange={(e) => setLiters(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cost (₹)</Label>
                <Input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={createExpense} onChange={(e) => setCreateExpense(e.target.checked)} />
                Create linked expense entry
              </label>
            </div>
            <Button
              className="bg-gold text-navy hover:bg-gold/90"
              disabled={!cost || addMut.isPending}
              onClick={() => addMut.mutate()}
            >
              Log fuel
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : !data?.data.length ? (
            <EmptyState title="No fuel logs" description="Record fuel purchases for this vehicle." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Liters</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((row: {
                    id: string; fuelDate?: string; liters?: number | null; cost: number; notes?: string | null;
                  }) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.fuelDate ? formatDate(row.fuelDate) : '—'}</TableCell>
                      <TableCell>{row.liters ?? '—'}</TableCell>
                      <TableCell>₹{row.cost.toLocaleString()}</TableCell>
                      <TableCell>{row.notes ?? '—'}</TableCell>
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
