'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Fuel, Route } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchElectionVehicle } from '@/lib/election';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['election-vehicle', id],
    queryFn: () => fetchElectionVehicle(id),
  });

  if (isLoading) return <PageLoader label="Loading vehicle…" />;
  if (isError || !data) return <EmptyState title="Vehicle not found" />;

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/election/vehicles')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={data.vehicleNumber}
        description={`${data.vehicleType} · ${data.driverName ?? 'No driver assigned'}`}
        actions={<StatusBadge status={data.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Vehicle info</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">Owner</p><p>{data.ownerName ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Driver mobile</p><p>{data.driverMobile ?? '—'}</p></div>
            {data.notes && (
              <div className="sm:col-span-2"><p className="text-sm text-muted-foreground">Notes</p><p>{data.notes}</p></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Logs</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/election/vehicles/${id}/trips`}><Route className="h-4 w-4" /> Trip logs</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/election/vehicles/${id}/fuel`}><Fuel className="h-4 w-4" /> Fuel logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
