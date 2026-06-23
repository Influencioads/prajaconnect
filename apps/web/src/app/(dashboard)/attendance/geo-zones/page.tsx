'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchGeoZones, createGeoZone, deleteGeoZone } from '@/lib/attendance';
import { useAuth } from '@/lib/auth';

export default function GeoZonesPage() {
  const [page, setPage] = React.useState(1);
  const [name, setName] = React.useState('');
  const [latitude, setLatitude] = React.useState('16.43');
  const [longitude, setLongitude] = React.useState('80.56');
  const [radiusM, setRadiusM] = React.useState('150');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('attendance'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-geo-zones', page],
    queryFn: () => fetchGeoZones({ page, limit: 20 }),
  });

  const create = useMutation({
    mutationFn: createGeoZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-geo-zones'] });
      setName('');
    },
  });

  const remove = useMutation({
    mutationFn: deleteGeoZone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-geo-zones'] }),
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate({
      name: name.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusM: parseInt(radiusM, 10) || 100,
    });
  };

  return (
    <>
      <PageHeader title="Geo-Fence Zones" description="Define allowed check-in areas for GPS verification." />
      {canEdit && (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border p-4">
          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Zone name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Latitude</label>
            <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Longitude</label>
            <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Radius (m)</label>
            <Input value={radiusM} onChange={(e) => setRadiusM(e.target.value)} />
          </div>
          <Button onClick={handleCreate} disabled={create.isPending}>Add Zone</Button>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mandal</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Radius</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.data ?? []).map((z: {
              id: string;
              name: string;
              latitude: number;
              longitude: number;
              radiusM: number;
              mandal?: { name: string } | null;
            }) => (
              <TableRow key={z.id}>
                <TableCell>{z.name}</TableCell>
                <TableCell>{z.mandal?.name ?? '—'}</TableCell>
                <TableCell>{z.latitude.toFixed(4)}, {z.longitude.toFixed(4)}</TableCell>
                <TableCell>{z.radiusM} m</TableCell>
                <TableCell>
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => remove.mutate(z.id)}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </>
  );
}
