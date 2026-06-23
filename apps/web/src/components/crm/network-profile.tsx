'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { NetworkFormDialog } from '@/components/crm/network-form-dialog';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { fetchNetworkDetail, deleteNetworkRecord } from '@/lib/crm';
import { formatDate, formatNumber, initials } from '@/lib/utils';
import { type NetworkViewConfig } from '@/lib/network-config';

export function NetworkProfile({ config, id }: { config: NetworkViewConfig; id: string }) {
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('committees'));
  const canDelete = accessLevel('committees') === 'full';
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['network-detail', config.resource, id],
    queryFn: () => fetchNetworkDetail(config.resource, id),
  });

  const del = useMutation({
    mutationFn: () => deleteNetworkRecord(config.resource, id),
    onSuccess: () => {
      toast({ title: 'Member removed', variant: 'success' });
      router.push(`/committees/${config.key}`);
    },
    onError: (err) => toast({ title: 'Delete failed', description: apiError(err), variant: 'error' }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const detailFields = [
    { label: 'WhatsApp', value: data.whatsapp },
    { label: 'Gender', value: data.gender },
    { label: 'Age', value: data.age },
    { label: 'Designation', value: data.designation },
    { label: 'Category Type', value: data.categoryType },
    { label: 'Mandal', value: data.mandal?.name },
    { label: 'Village', value: data.village?.name },
    { label: 'Ward Number', value: data.wardNumber },
    { label: 'Booth Number', value: data.boothNumber },
    { label: 'Political Influence', value: data.politicalInfluenceLevel },
    { label: 'Public Reach', value: data.publicReach != null ? formatNumber(data.publicReach) : null },
    { label: 'Assigned Area', value: data.assignedArea },
    { label: 'Reporting Person', value: data.reportingPerson?.name },
  ];

  const extraFields = config.extraFields.map((f) => ({
    label: f.label.replace(/\s*\(.*\)$/, '').replace(/ \*$/, ''),
    value: formatValue(data[f.key], f.type),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/committees/${config.key}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {config.title}
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm(`Remove ${data.fullName}?`)) del.mutate();
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-xl font-bold text-white dark:bg-gold dark:text-navy">
            {initials(data.fullName)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">{data.fullName}</h1>
              <StatusBadge status={data.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {data.mobile}
              </span>
              {data.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {data.email}
                </span>
              )}
              {data.assignedArea && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {data.assignedArea}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {[...detailFields, ...extraFields].map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-foreground">{display(f.value)}</dd>
                  </div>
                ))}
              </dl>
              {data.address && (
                <div className="mt-4 border-t pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{data.address}</dd>
                </div>
              )}
              {data.notes && (
                <div className="mt-4 border-t pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{data.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline
              resource={config.resource}
              id={id}
              activity={data.activity ?? []}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      </div>

      <NetworkFormDialog open={editOpen} onOpenChange={setEditOpen} config={config} record={data} />
    </div>
  );
}

function formatValue(value: unknown, type?: string): string | number | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  if (type === 'date') return formatDate(String(value));
  if (type === 'number') return formatNumber(value as number);
  return value as string;
}

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}
