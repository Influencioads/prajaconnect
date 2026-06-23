'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, Pencil, Users2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { CadreFormDialog } from '@/components/crm/cadre-form-dialog';
import { useAuth } from '@/lib/auth';
import { fetchCadreDetail } from '@/lib/crm';
import { formatDate, initials } from '@/lib/utils';

export default function CadreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('cadre'));
  const [editOpen, setEditOpen] = React.useState(false);

  const { data: c, isLoading, isError } = useQuery({
    queryKey: ['cadre-detail', id],
    queryFn: () => fetchCadreDetail(id),
  });

  if (isLoading) return <PageLoader label="Loading cadre…" />;
  if (isError || !c) return <EmptyState title="Cadre not found" />;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/cadre')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={c.name}
        description={`${c.designation} · ${c.level}`}
        actions={
          canEdit ? (
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-2xl font-bold text-white">
              {initials(c.name)}
            </div>
            <h3 className="mt-3 font-display text-lg font-bold">{c.name}</h3>
            <p className="text-sm text-muted-foreground">{c.designation}</p>
            <div className="mt-2 flex gap-2">
              <StatusBadge status={c.status} />
              <Badge variant="gold">{c.performance}% perf</Badge>
            </div>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <Row icon={Phone} label="Mobile" value={c.mobile} />
              {c.email && <Row icon={Mail} label="Email" value={c.email} />}
              <Row icon={MapPin} label="Mandal" value={c.mandal?.name ?? '—'} />
              <Row
                icon={MapPin}
                label="Booth"
                value={c.booth ? `#${c.booth.number}${c.booth.name ? ` · ${c.booth.name}` : ''}` : '—'}
              />
              <Row icon={Users2} label="Joined" value={formatDate(c.joinedAt)} />
            </div>
            {c.parent && (
              <div className="mt-4 w-full rounded-lg border bg-muted/40 p-3 text-left">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Reports to</p>
                <Link href={`/cadre/${c.parent.id}`} className="text-sm font-semibold hover:text-primary">
                  {c.parent.name}
                </Link>
                <p className="text-xs text-muted-foreground">{c.parent.designation}</p>
              </div>
            )}
            {c.address && <p className="mt-3 text-xs text-muted-foreground">{c.address}</p>}
            {c.notes && <p className="mt-2 text-xs italic text-muted-foreground">“{c.notes}”</p>}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team ({c.children.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {c.children.length ? (
                c.children.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/cadre/${ch.id}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-semibold">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ch.designation} · {ch.mobile}
                      </p>
                    </div>
                    <StatusBadge status={ch.status} />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No direct reports.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Grievances ({c.assignedGrievances.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {c.assignedGrievances.length ? (
                c.assignedGrievances.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.code} · {formatDate(g.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <StatusBadge status={g.priority} />
                      <StatusBadge status={g.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No grievances assigned.</p>
              )}
            </CardContent>
          </Card>

          {c.organizedEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Organized Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.organizedEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.type} · {formatDate(e.startAt)}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CadreFormDialog open={editOpen} onOpenChange={setEditOpen} cadre={c} />
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
