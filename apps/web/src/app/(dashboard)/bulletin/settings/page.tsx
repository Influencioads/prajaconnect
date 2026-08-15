'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchBulletinConfig,
  fetchBulletinSubscription,
  saveBulletinSubscription,
  updateBulletinConfig,
} from '@/lib/bulletin';
import { fetchGeoOptions } from '@/lib/crm';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';

export default function BulletinSettingsPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('bulletin'));
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: config } = useQuery({ queryKey: ['bulletin-config'], queryFn: fetchBulletinConfig });
  const { data: sub } = useQuery({ queryKey: ['bulletin-subscription'], queryFn: fetchBulletinSubscription });
  const { data: geo } = useQuery({ queryKey: ['geo-options'], queryFn: fetchGeoOptions });

  const [scope, setScope] = React.useState('full');
  const [mandalId, setMandalId] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [channels, setChannels] = React.useState({ push: true, whatsapp: false, email: false });

  React.useEffect(() => {
    if (!sub) return;
    setScope(sub.scope ?? 'full');
    setMandalId(sub.mandalId ?? '');
    setActive(sub.active);
    setChannels({
      push: sub.channels?.push ?? true,
      whatsapp: sub.channels?.whatsapp ?? false,
      email: sub.channels?.email ?? false,
    });
  }, [sub]);

  const toggleEnabled = useMutation({
    mutationFn: (enabled: boolean) => updateBulletinConfig(enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulletin-config'] }),
    onError: (e) => toast({ title: apiError(e), variant: 'error' }),
  });

  const save = useMutation({
    mutationFn: () =>
      saveBulletinSubscription({
        scope,
        mandalId: scope === 'mandal' ? mandalId || null : null,
        channels,
        active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bulletin-subscription'] });
      toast({ title: 'Subscription saved' });
    },
    onError: (e) => toast({ title: apiError(e), variant: 'error' }),
  });

  return (
    <>
      <PageHeader
        title="Bulletin Settings"
        description="Automatic generation and your personal delivery preferences."
        actions={<Button variant="outline" asChild><Link href="/bulletin">Archive</Link></Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Automatic Generation</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Daily at 5:00 AM IST, weekly on Mondays and monthly on the 1st (6:00 AM IST).
            </p>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="font-medium">
                Scheduled bulletins are {config?.enabled ? 'enabled' : 'disabled'}
              </span>
              {canEdit && (
                <Button
                  variant={config?.enabled ? 'destructive' : 'gold'}
                  size="sm"
                  onClick={() => toggleEnabled.mutate(!config?.enabled)}
                  disabled={toggleEnabled.isPending}
                >
                  {config?.enabled ? 'Disable' : 'Enable'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Subscription</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <label className="flex items-center justify-between">
              <span className="font-medium">Receive the bulletin</span>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
            </label>

            <div className="space-y-1">
              <p className="font-medium">Coverage</p>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="full">Full constituency</option>
                <option value="mandal">Single mandal</option>
              </select>
              {scope === 'mandal' && (
                <select
                  value={mandalId}
                  onChange={(e) => setMandalId(e.target.value)}
                  className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select mandal…</option>
                  {(geo?.mandals ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-medium">Channels</p>
              {([
                ['push', 'Push notification & in-app'],
                ['whatsapp', 'WhatsApp (PDF document)'],
                ['email', 'Email (PDF attachment)'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={channels[key]}
                    onChange={(e) => setChannels((c) => ({ ...c, [key]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save preferences'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
