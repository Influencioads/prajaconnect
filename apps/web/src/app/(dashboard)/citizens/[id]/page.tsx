'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, MapPin, Pencil, CreditCard, Vote } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CitizenFormDialog } from '@/components/crm/citizen-form-dialog';
import { useAuth } from '@/lib/auth';
import { fetchCitizenDetail } from '@/lib/crm';
import { formatDate, initials, formatNumber } from '@/lib/utils';

export default function CitizenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('citizens'));
  const [editOpen, setEditOpen] = React.useState(false);

  const { data: c, isLoading, isError } = useQuery({
    queryKey: ['citizen-detail', id],
    queryFn: () => fetchCitizenDetail(id),
  });

  if (isLoading) return <PageLoader label="Loading citizen…" />;
  if (isError || !c) return <EmptyState title="Citizen not found" />;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/citizens')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={c.name}
        description={[c.occupation, c.category].filter(Boolean).join(' · ') || 'Citizen profile'}
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
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <StatusBadge status={c.status} />
              {c.isFamilyHead && <Badge variant="gold">Family Head</Badge>}
              {c.gender && <Badge variant="muted">{c.gender}</Badge>}
            </div>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <Row icon={Phone} label="Mobile" value={c.mobile ?? '—'} />
              <Row icon={Vote} label="Voter ID" value={c.voterId ?? '—'} />
              <Row icon={CreditCard} label="Aadhaar" value={c.aadhaarMasked ?? '—'} />
              <Row icon={MapPin} label="Mandal" value={c.mandal?.name ?? '—'} />
              <Row icon={MapPin} label="Village" value={c.village?.name ?? '—'} />
              <Row
                icon={MapPin}
                label="Booth"
                value={c.booth ? `#${c.booth.number}` : '—'}
              />
              <Row icon={Vote} label="Age" value={c.age ? `${c.age} years` : '—'} />
              <Row icon={Vote} label="DOB" value={c.dob ? formatDate(c.dob) : '—'} />
            </div>
            {c.address && <p className="mt-3 text-xs text-muted-foreground">{c.address}</p>}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="family">
            <TabsList>
              <TabsTrigger value="family">Family</TabsTrigger>
              <TabsTrigger value="grievances">Grievances ({c.grievances.length})</TabsTrigger>
              <TabsTrigger value="welfare">Welfare ({c.beneficiaries.length})</TabsTrigger>
              <TabsTrigger value="events">Events ({c.eventAttendees.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="family">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {c.family ? `Family of ${c.family.headName}` : 'Family'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.family ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Info label="Ration card" value={c.family.rationCard ?? '—'} />
                        <Info label="Address" value={c.family.address ?? '—'} />
                      </div>
                      <div className="space-y-2">
                        {c.family.members.map((m) => (
                          <Link
                            key={m.id}
                            href={`/citizens/${m.id}`}
                            className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50"
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                {m.name}
                                {m.id === c.id && <span className="ml-2 text-xs text-muted-foreground">(this person)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[m.gender, m.age ? `${m.age}y` : null].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                            {m.isFamilyHead && <Badge variant="gold">Head</Badge>}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState title="No family linked" description="Edit this citizen to map a family." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grievances">
              <Card>
                <CardContent className="space-y-2 pt-6">
                  {c.grievances.length ? (
                    c.grievances.map((g) => (
                      <Link
                        key={g.id}
                        href={`/grievances/${g.id}`}
                        className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/40"
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
                      </Link>
                    ))
                  ) : (
                    <EmptyState title="No grievances" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="welfare">
              <Card>
                <CardContent className="space-y-2 pt-6">
                  {c.beneficiaries.length ? (
                    c.beneficiaries.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{b.scheme.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.scheme.code} · Applied {formatDate(b.appliedAt)}
                            {b.disbursedAmount ? ` · ₹${formatNumber(b.disbursedAmount)}` : ''}
                          </p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No welfare records" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardContent className="space-y-2 pt-6">
                  {c.eventAttendees.length ? (
                    c.eventAttendees.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.event.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(a.event.startAt)}</p>
                        </div>
                        {a.checkedInAt ? (
                          <Badge variant="success">Checked in</Badge>
                        ) : (
                          <Badge variant="muted">Registered</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No event participation" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CitizenFormDialog open={editOpen} onOpenChange={setEditOpen} citizen={c} />
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
