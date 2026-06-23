'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Send, Megaphone, MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { cn, formatDateTime, initials } from '@/lib/utils';
import {
  fetchConversations,
  fetchConversation,
  sendWaMessage,
  sendBroadcast,
} from '@/lib/crm';

export default function WhatsAppPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('whatsapp'));
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [broadcastOpen, setBroadcastOpen] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: convos, isLoading } = useQuery({
    queryKey: ['wa-conversations', debounced],
    queryFn: () => fetchConversations(debounced || undefined),
  });

  React.useEffect(() => {
    if (!activeId && convos?.length) setActiveId(convos[0].id);
  }, [convos, activeId]);

  const { data: active } = useQuery({
    queryKey: ['wa-conversation', activeId],
    queryFn: () => fetchConversation(activeId as string),
    enabled: !!activeId,
  });

  const sendMut = useMutation({
    mutationFn: () => sendWaMessage(activeId as string, draft),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['wa-conversation', activeId] });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <>
      <PageHeader
        title="WhatsApp Inbox"
        description="Two-way citizen conversations and broadcast campaigns."
        actions={
          canEdit ? (
            <Button variant="outline" onClick={() => setBroadcastOpen(true)}>
              <Megaphone className="h-4 w-4" /> Broadcast
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        <div className="grid h-[calc(100vh-16rem)] grid-cols-1 md:grid-cols-3">
          <div className="border-r">
            <div className="border-b p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search chats…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : !convos?.length ? (
                <EmptyState title="No conversations" />
              ) : (
                convos.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b px-3 py-3 text-left hover:bg-muted/50',
                      activeId === c.id && 'bg-muted',
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                      {initials(c.contactName ?? c.contactMobile)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.contactName ?? c.contactMobile}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.messages[0]?.body ?? 'No messages'}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <Badge variant="success">{c.unreadCount}</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col md:col-span-2">
            {!active ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState icon={MessageCircle} title="Select a conversation" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                    {initials(active.contactName ?? active.contactMobile)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{active.contactName ?? active.contactMobile}</p>
                    <p className="text-xs text-muted-foreground">{active.contactMobile}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn('flex', m.direction === 'Outbound' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                          m.direction === 'Outbound'
                            ? 'rounded-br-sm bg-green-600 text-white'
                            : 'rounded-bl-sm bg-card',
                        )}
                      >
                        <p>{m.body}</p>
                        <p className={cn('mt-0.5 text-[10px]', m.direction === 'Outbound' ? 'text-green-100' : 'text-muted-foreground')}>
                          {formatDateTime(m.createdAt)} · {m.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex gap-2 border-t p-3">
                    <Input
                      placeholder="Type a message…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && draft.trim()) sendMut.mutate();
                      }}
                    />
                    <Button disabled={!draft.trim() || sendMut.isPending} onClick={() => sendMut.mutate()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      <BroadcastDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />
    </>
  );
}

function BroadcastDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [body, setBody] = React.useState('');
  const mut = useMutation({
    mutationFn: () => sendBroadcast(body),
    onSuccess: (res) => {
      toast({
        title: 'Broadcast queued',
        description: `${res.recipients} recipients · ${res.note}`,
        variant: 'success',
      });
      setBody('');
      onOpenChange(false);
    },
    onError: (e) => toast({ title: 'Failed', description: apiError(e), variant: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Broadcast message</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your campaign message…" />
          </div>
          <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
            Broadcast is simulated in this build. Connect a WhatsApp Business API provider to deliver to all contacts.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!body.trim() || mut.isPending} onClick={() => mut.mutate()}>Send broadcast</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
