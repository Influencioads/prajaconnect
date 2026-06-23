'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { fetchWarRoomBriefings } from '@/lib/war-room';

export default function WarRoomBriefingsPage() {
  const { data } = useQuery({ queryKey: ['war-room-briefings'], queryFn: () => fetchWarRoomBriefings({ page: 1, limit: 30 }) });

  return (
    <>
      <PageHeader title="Daily Briefings" description="Leader daily briefing history." />
      <div className="space-y-3">
        {(data?.data ?? []).map((b: { id: string; summary: string; date: string; createdBy?: { name: string } }) => (
          <Card key={b.id}>
            <CardContent className="pt-4">
              <p className="text-sm">{b.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(b.date).toLocaleString()} · {b.createdBy?.name ?? 'System'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
