'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, CheckCircle2, MessageSquare, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { SurveyBuilderDialog } from '@/components/crm/survey-builder-dialog';
import { fetchSurveys, fetchSurveyStats } from '@/lib/crm';
import { formatDate } from '@/lib/utils';

const ALL = '__all__';

export default function SurveysPage() {
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState(ALL);
  const [dialog, setDialog] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats } = useQuery({ queryKey: ['survey-stats'], queryFn: fetchSurveyStats });
  const { data, isLoading } = useQuery({
    queryKey: ['surveys', debounced, status],
    queryFn: () =>
      fetchSurveys({ search: debounced || undefined, status: status === ALL ? undefined : status, limit: 50 }),
  });

  return (
    <>
      <PageHeader
        title="Surveys"
        description="Field surveys, polls and citizen feedback."
        actions={
          <Button onClick={() => setDialog(true)}>
            <Plus className="h-4 w-4" /> Create survey
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Surveys" value={stats?.total ?? 0} icon={ClipboardList} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <KpiCard label="Responses" value={stats?.responses ?? 0} icon={MessageSquare} accent="bg-purple-100 text-purple-700" />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search surveys…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All status</SelectItem>
                {['Draft', 'Active', 'Closed'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !data?.data.length ? (
            <EmptyState title="No surveys found" description="Create a survey to gather citizen feedback." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((s) => (
                <Link key={s.id} href={`/surveys/${s.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="space-y-2 pt-5">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="font-display text-base font-bold">{s.title}</p>
                      {s.description && <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>}
                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span>{s._count.responses} responses</span>
                        <span>{formatDate(s.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SurveyBuilderDialog open={dialog} onOpenChange={setDialog} />
    </>
  );
}
