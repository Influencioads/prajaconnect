'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, CalendarDays, Users, QrCode, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import { checkInAttendee, fetchEventDetail } from '@/lib/crm';
import { formatDateTime } from '@/lib/utils';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => fetchEventDetail(id),
  });

  const checkIn = useMutation({
    mutationFn: () => checkInAttendee(id, { name: name || undefined, mobile: mobile || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      setName('');
      setMobile('');
      toast({ title: 'Attendee checked in', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed', description: apiError(err), variant: 'error' }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!event) return <EmptyState title="Event not found" />;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/events')}>
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold">{event.title}</h1>
                <Badge variant="muted">{event.type}</Badge>
                <StatusBadge status={event.status} />
              </div>
              {event.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{event.description}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDateTime(event.startAt)}</span>
                {event.venue && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue}</span>}
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{event.attendees.length} checked in
                  {event.expectedAttendees ? ` / ${event.expectedAttendees} expected` : ''}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-4 w-4" /> Check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              QR check-in token: <span className="font-mono text-foreground">{event.qrToken ?? '—'}</span>. Scan-to-attend
              coming soon; use manual entry below in the meantime.
            </div>
            <div className="space-y-1.5">
              <Label>Attendee name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
            </div>
            <Button
              className="w-full"
              disabled={!name.trim() || checkIn.isPending}
              onClick={() => checkIn.mutate()}
            >
              <UserPlus className="h-4 w-4" /> {checkIn.isPending ? 'Checking in…' : 'Check in'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Attendees ({event.attendees.length})</CardTitle></CardHeader>
          <CardContent>
            {!event.attendees.length ? (
              <EmptyState title="No attendees yet" description="Check in attendees as they arrive." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Checked in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.attendees.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.citizen?.name ?? a.name ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.mobile ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(a.checkedInAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
