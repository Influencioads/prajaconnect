'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ShieldCheck,
  HeartPulse,
  AlertTriangle,
  Flame,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchAiOverview, type ScoreCard, type ScoreBand } from '@/lib/crm';
import { cn } from '@/lib/utils';

const BAND_COLOR: Record<ScoreBand, string> = {
  Critical: 'text-red-600',
  'At Risk': 'text-amber-600',
  Stable: 'text-blue-600',
  Strong: 'text-green-600',
};
const BAND_STROKE: Record<ScoreBand, string> = {
  Critical: '#dc2626',
  'At Risk': '#d97706',
  Stable: '#2563eb',
  Strong: '#16a34a',
};
const SEVERITY_COLOR: Record<string, string> = {
  High: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function Gauge({ score, band }: { score: number; band: ScoreBand }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={BAND_STROKE[band]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl font-bold">{score}</span>
        <span className={cn('text-xs font-semibold', BAND_COLOR[band])}>{band}</span>
      </div>
    </div>
  );
}

function ScoreBlock({
  title,
  icon: Icon,
  card,
  footer,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  card: ScoreCard;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          <Gauge score={card.score} band={card.band} />
          <div className="flex-1 space-y-2.5">
            {card.components.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-semibold">{c.value}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {footer && <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
}

export default function AiCommandPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['ai-overview'], queryFn: fetchAiOverview });

  return (
    <>
      <PageHeader
        title="AI Command Center"
        description="Rule-based intelligence over live constituency data — health, readiness, sentiment and risk."
      />

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Unable to load intelligence"
            description="The AI command center could not be computed. Please retry shortly."
          />
        </div>
      )}

      {data && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <ScoreBlock title="Constituency Health" icon={HeartPulse} card={data.health} />
            <ScoreBlock
              title="Election Readiness"
              icon={ShieldCheck}
              card={data.readiness}
              footer={`Booth coverage: ${data.readiness.boothsCovered}/${data.readiness.boothsTotal} booths staffed.`}
            />
            <ScoreBlock
              title="Public Sentiment"
              icon={Activity}
              card={data.sentiment}
              footer={`Avg satisfaction ${data.sentiment.avgRating || '—'}/5 from ${data.sentiment.sampleSize} feedback responses · ${data.sentiment.surveyResponses} survey responses.`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> PR Intelligence (4h cycle)
                {data.prBriefing?.openPrAlerts != null && data.prBriefing.openPrAlerts > 0 && (
                  <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                    {data.prBriefing.openPrAlerts} open alert(s)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.prBriefing?.available ? (
                <>
                  <p className="text-sm">{data.prBriefing.summary}</p>
                  {data.prBriefing.generatedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last report: {new Date(data.prBriefing.generatedAt).toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{data.prBriefing?.summary ?? 'No PR reports yet.'}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Daily Briefing
                <span className="ml-auto text-xs font-normal text-muted-foreground">{data.briefing.date}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.briefing.headlines.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs italic text-muted-foreground">{data.briefing.note}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-red-600" /> SLA Risk Alerts
                  <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    {data.alerts.slaBreachCount}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.slaAlerts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No SLA breaches. All grievances on track.</p>
                ) : (
                  data.alerts.slaAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          <span className="text-muted-foreground">{a.code}</span> · {a.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.mandal ?? 'Unassigned'} · {a.department ?? 'No dept'} · {a.status}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', SEVERITY_COLOR[a.severity])}>
                          {a.severity}
                        </span>
                        <span className="text-xs text-red-600">{a.overdueDays}d overdue</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="h-4 w-4 text-amber-600" /> Mandal Hotspots
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.hotspotAlerts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No grievance hotspots detected.</p>
                ) : (
                  data.alerts.hotspotAlerts.map((h) => (
                    <div key={h.mandal} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0">
                      <span className="font-medium">{h.mandal}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{h.openGrievances} open</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', SEVERITY_COLOR[h.severity])}>
                          {h.severity}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
