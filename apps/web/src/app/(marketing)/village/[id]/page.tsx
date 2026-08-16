'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchVillageFeed } from '@/lib/service-desk';

function Progress({ pct }: { pct: number }) {
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-muted">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} <span className="text-sm font-normal text-muted-foreground">({count})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {count === 0 ? <p className="text-sm text-muted-foreground">Nothing to show yet.</p> : children}
      </CardContent>
    </Card>
  );
}

export default function VillageFeedPage() {
  const params = useParams<{ id: string }>();
  const villageId = params.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['village-feed', villageId],
    queryFn: () => fetchVillageFeed(villageId),
    enabled: !!villageId,
  });

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Loading village feed…</div>;
  if (isError || !data) return <div className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Village not found.</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div>
        <h1 className="font-display text-3xl font-bold">My Village — {data.village.name}</h1>
        {data.village.mandal && <p className="text-muted-foreground">{data.village.mandal.name} Mandal</p>}
      </div>

      <Section title="Development projects" count={data.projects.length}>
        {data.projects.map((p) => (
          <div key={p.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{[p.category, p.status].filter(Boolean).join(' · ')}</p>
              </div>
              <span className="text-sm font-semibold">{p.progressPct}%</span>
            </div>
            <Progress pct={p.progressPct} />
            <p className="mt-2 text-xs text-muted-foreground">
              ₹{p.spent.toLocaleString('en-IN')} spent of ₹{p.budget.toLocaleString('en-IN')}
              {p.expectedEndDate ? ` · due ${new Date(p.expectedEndDate).toLocaleDateString()}` : ''}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Promise updates" count={data.promiseUpdates.length}>
        {data.promiseUpdates.map((u) => (
          <div key={u.id} className="rounded-lg border p-3">
            <p className="font-medium">{u.promise.title}</p>
            <p className="mt-1 text-sm">{u.note}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {u.promise.workStatus} · {u.promise.completionPct}% · {new Date(u.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Upcoming service camps" count={data.serviceCamps.length}>
        {data.serviceCamps.map((c) => (
          <div key={c.id} className="rounded-lg border p-3">
            <p className="font-medium">{c.title ?? c.name ?? 'Service camp'}</p>
            <p className="text-xs text-muted-foreground">
              {[c.startAt ? new Date(c.startAt).toLocaleString() : null, c.venue].filter(Boolean).join(' · ')}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Sanctioned works" count={data.fundWorks.length}>
        {data.fundWorks.map((w) => (
          <div key={w.id} className="rounded-lg border p-3">
            <p className="font-medium">{w.title ?? w.name ?? 'Sanctioned work'}</p>
            <p className="text-xs text-muted-foreground">
              {[w.status, w.amount ? `₹${w.amount.toLocaleString('en-IN')}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Upcoming events" count={data.events.length}>
        {data.events.map((e) => (
          <div key={e.id} className="rounded-lg border p-3">
            <p className="font-medium">{e.title}</p>
            <p className="text-xs text-muted-foreground">
              {[new Date(e.startAt).toLocaleString(), e.venue, e.type].filter(Boolean).join(' · ')}
            </p>
          </div>
        ))}
      </Section>
    </div>
  );
}
