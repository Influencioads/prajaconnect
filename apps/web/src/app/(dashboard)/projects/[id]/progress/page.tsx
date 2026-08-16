'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Camera, MapPin, TrendingUp, History } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchProjectDetail } from '@/lib/crm';
import { fetchProjectProgress } from '@/lib/funds';

export default function ProjectProgressPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProjectDetail(id),
    enabled: !!id,
  });
  const { data: updates, isLoading } = useQuery({
    queryKey: ['project-progress', id],
    queryFn: () => fetchProjectProgress(id),
    enabled: !!id,
  });

  const withPhotos = updates?.filter((u) => u.photoUrl) ?? [];
  const geotagged = updates?.filter((u) => u.latitude != null && u.longitude != null) ?? [];

  return (
    <>
      <PageHeader
        title={project?.name ?? 'Project progress'}
        description="Geotagged milestone updates and photo timeline from the field."
        actions={
          <Button variant="outline" asChild>
            <Link href="/projects"><ArrowLeft className="h-4 w-4" /> All projects</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Progress" value={`${project?.progressPct ?? 0}%`} icon={TrendingUp} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Updates" value={updates?.length ?? 0} icon={History} accent="bg-purple-100 text-purple-700" />
        <KpiCard label="Photos" value={withPhotos.length} icon={Camera} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Geotagged" value={geotagged.length} icon={MapPin} accent="bg-emerald-100 text-emerald-700" />
      </div>

      {project && (
        <Card className="mt-4">
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <StatusBadge status={project.status} />
            {project.category && <Badge variant="muted">{project.category}</Badge>}
            {project.mandal && <span className="text-sm text-muted-foreground">{project.mandal.name}</span>}
            <div className="min-w-40 flex-1">
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(100, project.progressPct)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !updates?.length ? (
            <EmptyState
              title="No progress updates yet"
              description="Field cadre can capture milestone updates with photos and GPS from the mobile app."
            />
          ) : (
            <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
              {updates.map((u) => (
                <li key={u.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-navy" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{u.milestone}</p>
                    <Badge variant="muted">{u.percentComplete}%</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleString()} · {u.reportedBy?.name ?? 'Unknown'}
                    </span>
                  </div>
                  {u.notes && <p className="mt-1 text-sm text-muted-foreground">{u.notes}</p>}
                  {u.latitude != null && u.longitude != null && (
                    <a
                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      href={`https://www.google.com/maps?q=${u.latitude},${u.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin className="h-3 w-3" /> {u.latitude.toFixed(5)}, {u.longitude.toFixed(5)}
                    </a>
                  )}
                  {u.photoUrl && (
                    <a href={u.photoUrl} target="_blank" rel="noreferrer" className="mt-2 block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.photoUrl}
                        alt={u.milestone}
                        className="max-h-64 rounded-xl border border-border object-cover"
                      />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}
