'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTempGrievanceAnalytics, fetchTempGrievances } from '@/lib/crm';

const SOURCES = ['Call', 'CampaignCall', 'ConferenceCall', 'WhatsApp', 'WhatsAppBot', 'D2DSurvey', 'Email', 'SMS', 'FieldVisit', 'VolunteerNote', 'Manual'];

export default function BySourcePage() {
  const [source, setSource] = React.useState('WhatsApp');

  const { data: analytics } = useQuery({ queryKey: ['temp-grievance-analytics'], queryFn: fetchTempGrievanceAnalytics });
  const { data: list } = useQuery({
    queryKey: ['temp-grievances-by-source', source],
    queryFn: () => fetchTempGrievances({ source, limit: 10 }),
  });

  return (
    <>
      <PageHeader title="Source-wise Temp Grievances" description="Breakdown and recent items by capture source." />
      <div className="mb-4 flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button key={s} onClick={() => setSource(s)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${source === s ? 'bg-navy text-white' : 'bg-muted'}`}>
            {s} ({analytics?.bySource?.[s] ?? 0})
          </button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Recent from {source}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(list?.data ?? []).map((item) => (
            <Link key={item.id} href={`/temp-grievances/${item.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50">
              <span className="font-medium">{item.tempTicketId} — {item.issueSummary ?? item.citizenName}</span>
              <span className="text-sm text-muted-foreground">{item.validationStatus}</span>
            </Link>
          ))}
          {!list?.data.length && <p className="text-sm text-muted-foreground">No records for this source.</p>}
        </CardContent>
      </Card>
    </>
  );
}
