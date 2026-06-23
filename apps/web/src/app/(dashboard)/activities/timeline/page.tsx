'use client';

import { useQuery } from '@tanstack/react-query';
import { Phone, MessageCircle, Mail, CalendarClock, Activity as ActivityIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/utils';
import { fetchActivityTimeline, type TimelineItem } from '@/lib/crm';

function iconFor(item: TimelineItem) {
  if (item.kind === 'whatsapp') return MessageCircle;
  if (item.type === 'Call' || item.type === 'CampaignCall' || item.type === 'ConferenceCall') return Phone;
  if (item.type === 'Email') return Mail;
  if (item.type === 'Meeting' || item.type === 'Visit') return CalendarClock;
  return ActivityIcon;
}

export default function ActivityTimelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-timeline', 'global'],
    queryFn: () => fetchActivityTimeline({ limit: 80 }),
  });

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Activity Timeline"
        description="Unified feed of calls, WhatsApp, emails, meetings, tasks and field interactions."
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !items.length ? (
            <EmptyState title="No activity yet" description="Activity will appear here as it is logged." />
          ) : (
            <ol className="relative space-y-5 border-l pl-6">
              {items.map((it) => {
                const Icon = iconFor(it);
                return (
                  <li key={`${it.kind}-${it.id}`} className="relative">
                    <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-card">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{it.title}</p>
                        <span className="text-xs text-muted-foreground">{formatDateTime(it.date)}</span>
                      </div>
                      {it.body && <p className="text-sm text-muted-foreground line-clamp-2">{it.body}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}
