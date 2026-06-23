'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, AlertTriangle, CheckCircle2, Bell, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatDateTime } from '@/lib/utils';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '@/lib/crm';

const ICONS: Record<string, typeof Info> = {
  Info,
  Warning: AlertTriangle,
  Alert: AlertTriangle,
  Success: CheckCircle2,
};
const COLORS: Record<string, string> = {
  Info: 'bg-blue-100 text-blue-700',
  Warning: 'bg-amber-100 text-amber-700',
  Alert: 'bg-red-100 text-red-700',
  Success: 'bg-green-100 text-green-700',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  const readMut = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
  const readAllMut = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <>
      <PageHeader
        title="Notification Center"
        description={unread ? `${unread} unread notifications` : 'You are all caught up.'}
        actions={
          unread ? (
            <Button variant="outline" onClick={() => readAllMut.mutate()} disabled={readAllMut.isPending}>
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !data?.length ? (
        <EmptyState icon={Bell} title="No notifications" />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {data.map((n: NotificationItem) => {
              const Icon = ICONS[n.type] ?? Info;
              return (
                <div
                  key={n.id}
                  className={cn('flex items-start gap-3 p-4', !n.read && 'bg-primary/5')}
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', COLORS[n.type] ?? COLORS.Info)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => readMut.mutate(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
}
