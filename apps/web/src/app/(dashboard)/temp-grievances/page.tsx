'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileClock,
  Clock,
  CheckCircle2,
  ArrowRightLeft,
  ShieldAlert,
  GitMerge,
  Phone,
  MessageCircle,
  ClipboardCheck,
  Mail,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TempGrievanceFormDialog } from '@/components/crm/temp-grievance-form-dialog';
import { useAuth } from '@/lib/auth';
import { fetchTempGrievanceAnalytics } from '@/lib/crm';

const SOURCE_ICONS: Record<string, React.ElementType> = {
  Call: Phone,
  CampaignCall: Phone,
  WhatsApp: MessageCircle,
  D2DSurvey: ClipboardCheck,
  Email: Mail,
};

export default function TempGrievancesDashboardPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('tempgrievances'));
  const [formOpen, setFormOpen] = React.useState(false);

  const { data: analytics } = useQuery({
    queryKey: ['temp-grievance-analytics'],
    queryFn: fetchTempGrievanceAnalytics,
  });

  return (
    <>
      <PageHeader
        title="Temp Grievances"
        description="Validation layer for auto-captured complaints before official grievance registration."
        actions={
          canEdit ? (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/temp-grievances/validation-queue">Validation Queue</Link>
              </Button>
              <Button onClick={() => setFormOpen(true)}>Create manually</Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total" value={analytics?.total ?? 0} icon={FileClock} accent="bg-blue-100 text-blue-700" />
        <KpiCard label="Pending Validation" value={analytics?.pendingValidation ?? 0} icon={Clock} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Validated Today" value={analytics?.validatedToday ?? 0} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <KpiCard label="Converted" value={analytics?.converted ?? 0} icon={ArrowRightLeft} accent="bg-indigo-100 text-indigo-700" />
        <KpiCard label="Rejected / Spam" value={analytics?.rejectedSpam ?? 0} icon={ShieldAlert} accent="bg-red-100 text-red-700" />
        <KpiCard label="Duplicate Suspected" value={analytics?.duplicateSuspected ?? 0} icon={GitMerge} accent="bg-orange-100 text-orange-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Source-wise Count</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(analytics?.bySource ?? {}).map(([source, count]) => {
              const Icon = SOURCE_ICONS[source] ?? FileClock;
              return (
                <div key={source} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground" /> {source}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Priority & Geography</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">By Priority</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics?.byPriority ?? {}).map(([p, c]) => (
                  <span key={p} className="rounded-full bg-muted px-3 py-1 text-sm">{p}: {c}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Top Mandals</p>
              {(analytics?.byMandal ?? []).slice(0, 5).map((m) => (
                <div key={m.mandalId} className="flex justify-between py-1 text-sm">
                  <span>{m.name}</span><span className="font-medium">{m.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href="/temp-grievances/list">View all</Link></Button>
        <Button variant="outline" asChild><Link href="/temp-grievances/duplicates">Duplicate review</Link></Button>
        <Button variant="outline" asChild><Link href="/temp-grievances/reports">Reports</Link></Button>
      </div>

      <TempGrievanceFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
