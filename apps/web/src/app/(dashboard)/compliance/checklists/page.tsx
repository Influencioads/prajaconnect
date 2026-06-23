'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchChecklists, toggleChecklistItem } from '@/lib/compliance';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function ComplianceChecklistsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('compliance'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-checklists'],
    queryFn: () => fetchChecklists({ page: 1, limit: 50 }),
  });

  const toggle = useMutation({
    mutationFn: (itemId: string) => toggleChecklistItem(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance-checklists'] }),
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;

  return (
    <>
      <PageHeader title="Compliance Checklists" description="Election code of conduct and regulatory checklists." />
      <div className="grid gap-4 lg:grid-cols-2">
        {(data?.data ?? []).map((checklist) => {
          const done = checklist.items.filter((i) => i.completed).length;
          const pct = checklist.items.length ? Math.round((done / checklist.items.length) * 100) : 0;
          return (
            <Card key={checklist.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{checklist.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">{pct}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!canEdit || toggle.isPending}
                    onClick={() => canEdit && toggle.mutate(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition',
                      item.completed && 'bg-green-50 border-green-200',
                      canEdit && 'hover:bg-muted/50',
                    )}
                  >
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded border', item.completed && 'bg-green-600 border-green-600 text-white')}>
                      {item.completed && <Check className="h-3 w-3" />}
                    </span>
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
                  </button>
                ))}
                {!checklist.items.length && <p className="text-sm text-muted-foreground">No items</p>}
              </CardContent>
            </Card>
          );
        })}
        {!data?.data?.length && <p className="text-sm text-muted-foreground">No checklists yet</p>}
      </div>
    </>
  );
}
