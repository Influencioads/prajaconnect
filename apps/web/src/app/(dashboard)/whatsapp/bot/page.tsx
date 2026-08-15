'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, MessageCircle, Play } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { cn, formatDateTime, initials } from '@/lib/utils';
import {
  fetchWaBotConfig,
  updateWaBotConfig,
  fetchWaBotSessions,
  fetchConversation,
  resumeWaBot,
  type WaBotSession,
} from '@/lib/crm';

export default function WhatsAppBotPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('whatsapp'));
  const qc = useQueryClient();
  const { toast } = useToast();

  const [greeting, setGreeting] = React.useState('');
  const [transcriptId, setTranscriptId] = React.useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['wa-bot-config'],
    queryFn: fetchWaBotConfig,
  });

  React.useEffect(() => {
    if (config) setGreeting(config.greeting);
  }, [config]);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['wa-bot-sessions'],
    queryFn: fetchWaBotSessions,
  });

  const saveMut = useMutation({
    mutationFn: (payload: { enabled?: boolean; greeting?: string }) => updateWaBotConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-bot-config'] });
      toast({ title: 'Bot settings saved', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  const resumeMut = useMutation({
    mutationFn: (conversationId: string) => resumeWaBot(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-bot-sessions'] });
      toast({ title: 'Bot resumed for conversation', variant: 'success' });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <>
      <PageHeader
        title="WhatsApp Bot"
        description="AI citizen assistant — grievance intake, status checks and scheme answers."
        actions={
          <Link href="/whatsapp">
            <Button variant="outline">
              <MessageCircle className="h-4 w-4" /> Inbox
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" /> Bot settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !config ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-semibold">Bot enabled</p>
                    <p className="text-xs text-muted-foreground">
                      Auto-reply to inbound citizen messages.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={config.enabled ? 'default' : 'outline'}
                    disabled={!canEdit || saveMut.isPending}
                    onClick={() => saveMut.mutate({ enabled: !config.enabled })}
                  >
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label>Greeting message</Label>
                  <Textarea
                    rows={5}
                    value={greeting}
                    disabled={!canEdit}
                    onChange={(e) => setGreeting(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent when a citizen greets the bot. Replies are translated to Telugu automatically
                    when the citizen writes in Telugu.
                  </p>
                </div>
                {canEdit && (
                  <Button
                    disabled={saveMut.isPending || greeting === config.greeting}
                    onClick={() => saveMut.mutate({ greeting })}
                  >
                    Save greeting
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent bot sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !sessions?.length ? (
              <EmptyState
                icon={Bot}
                title="No bot sessions yet"
                description="Sessions appear here when the bot starts collecting grievance details from a citizen."
              />
            ) : (
              <div className="divide-y">
                {sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    canEdit={canEdit}
                    onTranscript={() => setTranscriptId(s.conversation.id)}
                    onResume={() => resumeMut.mutate(s.conversation.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TranscriptDialog conversationId={transcriptId} onClose={() => setTranscriptId(null)} />
    </>
  );
}

function SessionRow({
  session,
  canEdit,
  onTranscript,
  onResume,
}: {
  session: WaBotSession;
  canEdit: boolean;
  onTranscript: () => void;
  onResume: () => void;
}) {
  const state = session.state ?? {};
  const label = state.done
    ? `Filed ${state.reference ?? ''}`
    : state.intent
      ? `${state.intent}${state.step ? ` · asking ${state.step}` : ''}`
      : 'Idle';
  const contact = session.conversation.contactName ?? session.conversation.contactMobile;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
        {initials(contact)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{contact}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[state.name, state.village].filter(Boolean).join(' · ') || session.conversation.contactMobile}
        </p>
      </div>
      <Badge variant={state.done ? 'success' : 'muted'}>{label}</Badge>
      {session.conversation.status === 'bot_paused' && (
        <Badge variant="warning">Bot paused</Badge>
      )}
      <span className="hidden text-xs text-muted-foreground sm:block">
        {formatDateTime(session.updatedAt)}
      </span>
      {session.conversation.status === 'bot_paused' && canEdit && (
        <Button size="sm" variant="outline" onClick={onResume}>
          <Play className="h-3.5 w-3.5" /> Resume
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onTranscript}>
        Transcript
      </Button>
    </div>
  );
}

function TranscriptDialog({
  conversationId,
  onClose,
}: {
  conversationId: string | null;
  onClose: () => void;
}) {
  const { data: conv, isLoading } = useQuery({
    queryKey: ['wa-conversation', conversationId],
    queryFn: () => fetchConversation(conversationId as string),
    enabled: !!conversationId,
  });

  return (
    <Dialog open={!!conversationId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {conv ? `Transcript — ${conv.contactName ?? conv.contactMobile}` : 'Transcript'}
          </DialogTitle>
        </DialogHeader>
        {isLoading || !conv ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-lg bg-muted/30 p-3">
            {conv.messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex', m.direction === 'Outbound' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                    m.direction === 'Outbound'
                      ? 'rounded-br-sm bg-green-600 text-white'
                      : 'rounded-bl-sm bg-card',
                  )}
                >
                  <p>{m.body}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-[10px]',
                      m.direction === 'Outbound' ? 'text-green-100' : 'text-muted-foreground',
                    )}
                  >
                    {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
