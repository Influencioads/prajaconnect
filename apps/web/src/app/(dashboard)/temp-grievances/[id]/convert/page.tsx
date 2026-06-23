'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import {
  convertTempGrievance,
  fetchGrievanceOptions,
  fetchTempGrievanceDetail,
} from '@/lib/crm';
import {
  GrievanceSlaTimelinePicker,
  useSlaDaysWithPriority,
} from '@/components/crm/grievance-sla-timeline';

const NONE = '__none__';

export default function ConvertTempGrievancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: '',
    departmentId: '',
    assignedOfficialId: '',
    priority: 'Medium',
    notifyCitizen: true,
  });

  const { data: item, isLoading } = useQuery({
    queryKey: ['temp-grievance-detail', id],
    queryFn: () => fetchTempGrievanceDetail(id),
  });

  const { data: opts } = useQuery({ queryKey: ['grievance-options'], queryFn: fetchGrievanceOptions });

  React.useEffect(() => {
    if (item) {
      setForm((f) => ({
        ...f,
        title: item.issueSummary ?? f.title,
        description: item.issueDescription ?? f.description,
        category: item.issueCategory ?? f.category,
        priority: item.priority,
      }));
    }
  }, [item]);

  const officials = (opts?.officials ?? []).filter((o) => !form.departmentId || o.departmentId === form.departmentId);
  const selectedDept = opts?.departments.find((d) => d.id === form.departmentId);
  const [slaDays, setSlaDays] = useSlaDaysWithPriority(form.priority, selectedDept?.slaHours);

  const mutation = useMutation({
    mutationFn: () => convertTempGrievance(id, {
      title: form.title,
      description: form.description,
      category: form.category || undefined,
      departmentId: form.departmentId || undefined,
      assignedOfficialId: form.assignedOfficialId || undefined,
      priority: form.priority,
      notifyCitizen: form.notifyCitizen,
      slaDays,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['temp-grievance-detail', id] });
      qc.invalidateQueries({ queryKey: ['temp-grievances'] });
      toast({ title: `Converted to ${res.code}`, variant: 'success' });
      router.push(`/grievances/${res.grievanceId}`);
    },
    onError: (e) => toast({ title: 'Conversion failed', description: apiError(e), variant: 'error' }),
  });

  if (isLoading) return <PageLoader label="Loading…" />;
  if (!item) return <EmptyState title="Not found" />;

  return (
    <>
      <PageHeader title="Convert to Grievance" description={`${item.tempTicketId} → official grievance ticket`} />
      <Card>
        <CardContent className="grid max-w-xl gap-4 pt-6">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Low', 'Medium', 'High', 'Critical'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Department</Label>
              <Select value={form.departmentId || NONE} onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v === NONE ? '' : v, assignedOfficialId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(opts?.departments ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Official</Label>
              <Select value={form.assignedOfficialId || NONE} onValueChange={(v) => setForm((f) => ({ ...f, assignedOfficialId: v === NONE ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select official" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {officials.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <GrievanceSlaTimelinePicker
            slaDays={slaDays}
            onSlaDaysChange={setSlaDays}
            priority={form.priority}
            departmentSlaHours={selectedDept?.slaHours}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.notifyCitizen} onChange={(e) => setForm((f) => ({ ...f, notifyCitizen: e.target.checked }))} />
            Notify citizen via WhatsApp/SMS
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button disabled={mutation.isPending || form.title.length < 4} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Converting…' : 'Convert to Grievance'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
