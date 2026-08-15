'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveSocialPost,
  createSocialPost,
  deleteSocialPost,
  draftSocialPost,
  fetchSocialPosts,
  rejectSocialPost,
  runSocialScheduler,
  submitSocialPost,
  type SocialPost,
} from '@/lib/social';
import { useAuth } from '@/lib/auth';

const PLATFORMS = ['Twitter/X', 'Facebook', 'Instagram', 'YouTube', 'WhatsApp'];
const COLUMNS: { status: string; label: string }[] = [
  { status: 'Draft', label: 'Drafts' },
  { status: 'PendingApproval', label: 'Pending Approval' },
  { status: 'Approved', label: 'Approved (Scheduled)' },
  { status: 'Posted', label: 'Posted' },
];

export default function SocialCommandCenterPage() {
  const [form, setForm] = React.useState({ platform: PLATFORMS[0], content: '', mediaUrl: '', scheduledAt: '' });
  const [topic, setTopic] = React.useState('');
  const [tone, setTone] = React.useState('positive');
  const [draftNote, setDraftNote] = React.useState<string | null>(null);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('social'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => fetchSocialPosts({ page: 1, limit: 100 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['social-posts'] });

  const create = useMutation({
    mutationFn: () =>
      createSocialPost({
        platform: form.platform,
        content: form.content,
        mediaUrl: form.mediaUrl || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      invalidate();
      setForm({ platform: PLATFORMS[0], content: '', mediaUrl: '', scheduledAt: '' });
      setDraftNote(null);
    },
  });

  const draft = useMutation({
    mutationFn: () => draftSocialPost({ topic, tone }),
    onSuccess: (res) => {
      setForm((f) => ({ ...f, content: res.content }));
      setDraftNote(
        res.aiGenerated
          ? `AI draft grounded in ${res.grounding.promiseDone}/${res.grounding.promiseTotal} promises, ${res.grounding.projectDone}/${res.grounding.projectTotal} projects.`
          : 'AI unavailable — template draft from live stats.',
      );
    },
  });

  const submit = useMutation({ mutationFn: submitSocialPost, onSuccess: invalidate });
  const approve = useMutation({ mutationFn: approveSocialPost, onSuccess: invalidate });
  const reject = useMutation({ mutationFn: rejectSocialPost, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteSocialPost, onSuccess: invalidate });
  const runNow = useMutation({ mutationFn: runSocialScheduler, onSuccess: invalidate });

  const posts = data?.data ?? [];
  const byStatus = (status: string) => posts.filter((p) => p.status === status);

  return (
    <>
      <PageHeader
        title="Social Media Command Center"
        description="Draft, approve and schedule posts. Approved posts publish automatically every 5 minutes (simulated until platform APIs are connected)."
        actions={
          canEdit && (
            <Button variant="outline" disabled={runNow.isPending} onClick={() => runNow.mutate()}>
              {runNow.isPending ? 'Running…' : 'Run scheduler now'}
            </Button>
          )
        }
      />

      {canEdit && (
        <div className="mb-6 grid gap-4 rounded-lg border p-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Compose</h3>
            <div>
              <Label>Platform</Label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              >
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the post or use AI draft…"
              />
              {draftNote && <p className="mt-1 text-xs text-muted-foreground">{draftNote}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Media URL (optional)</Label>
                <Input value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} />
              </div>
              <div>
                <Label>Schedule at</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
            </div>
            <Button disabled={!form.content || create.isPending} onClick={() => create.mutate()}>
              Save draft
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">AI Draft</h3>
            <div>
              <Label>Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. road works progress in the constituency" />
            </div>
            <div>
              <Label>Tone</Label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {['positive', 'celebratory', 'informative', 'assertive rebuttal'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" disabled={!topic || draft.isPending} onClick={() => draft.mutate()}>
              {draft.isPending ? 'Drafting…' : 'Generate draft'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Drafts are grounded in live manifesto promise and development project stats.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = byStatus(col.status);
            return (
              <div key={col.status} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && <p className="text-xs text-muted-foreground">No posts</p>}
                  {items.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      canEdit={canEdit}
                      onSubmit={() => submit.mutate(post.id)}
                      onApprove={() => approve.mutate(post.id)}
                      onReject={() => reject.mutate(post.id)}
                      onDelete={() => remove.mutate(post.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function PostCard({
  post,
  canEdit,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
}: {
  post: SocialPost;
  canEdit: boolean;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-1 flex items-center justify-between">
        <StatusBadge status={post.platform} />
        {post.scheduledAt && post.status !== 'Posted' && (
          <span className="text-xs text-muted-foreground">{new Date(post.scheduledAt).toLocaleString()}</span>
        )}
        {post.postedAt && (
          <span className="text-xs text-muted-foreground">Posted {new Date(post.postedAt).toLocaleString()}</span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm">{post.content}</p>
      {canEdit && post.status !== 'Posted' && (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.status === 'Draft' && (
            <>
              <Button size="sm" variant="outline" onClick={onSubmit}>Submit</Button>
              <Button size="sm" variant="outline" onClick={onDelete}>Delete</Button>
            </>
          )}
          {post.status === 'PendingApproval' && (
            <>
              <Button size="sm" onClick={onApprove}>Approve</Button>
              <Button size="sm" variant="outline" onClick={onReject}>Reject</Button>
            </>
          )}
          {post.status === 'Approved' && (
            <Button size="sm" variant="outline" onClick={onReject}>Back to draft</Button>
          )}
        </div>
      )}
    </div>
  );
}
