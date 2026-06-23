'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { D2DSurveyStatus } from '@praja/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { fetchD2DSurveys, updateD2DSurveyStatus } from '@/lib/d2d';

export default function D2DActivePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['d2d-surveys', { status: D2DSurveyStatus.Active }],
    queryFn: () => fetchD2DSurveys({ status: D2DSurveyStatus.Active, limit: 50 }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: D2DSurveyStatus }) => updateD2DSurveyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['d2d-surveys'] });
      queryClient.invalidateQueries({ queryKey: ['d2d-stats'] });
      toast({ title: 'Survey status updated', variant: 'success' });
    },
  });

  return (
    <>
      <PageHeader title="Active Surveys" description="Monitor progress, pause or close running door-to-door surveys." />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="space-y-4">
              {(data?.data ?? []).map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-navy">{s.name}</h3>
                      {s.nameTe && <p className="text-sm text-muted-foreground">{s.nameTe}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{s.targetMandal?.name}</span>
                        <span>{s.targetVillage?.name}</span>
                        <span>Booth {s.targetBooth?.number}</span>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${s.progressPct ?? 0}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                    <span>Target: <strong>{s.targetHouseholds}</strong></span>
                    <span>Completed: <strong>{s.completedHouseholds ?? 0}</strong></span>
                    <span>Pending: <strong>{s.pendingHouseholds ?? 0}</strong></span>
                    <span>Volunteers: <strong>{s._count?.assignments ?? 0}</strong></span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: s.id, status: D2DSurveyStatus.Paused })}>Pause</Button>
                    <Button size="sm" variant="gold" onClick={() => statusMut.mutate({ id: s.id, status: D2DSurveyStatus.Closed })}>Close Survey</Button>
                  </div>
                </div>
              ))}
              {!data?.data?.length && <p className="py-8 text-center text-muted-foreground">No active surveys.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
