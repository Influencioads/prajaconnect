'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Download, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BULLETIN_SECTION_LINKS, downloadBulletinPdf, fetchBulletin, type BulletinSection } from '@/lib/bulletin';

function Delta({ delta }: { delta?: number }) {
  if (delta == null || delta === 0) return null;
  const up = delta > 0;
  return (
    <span className={`ml-1 inline-flex items-center text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? `+${delta}` : delta}
    </span>
  );
}

function SectionCard({ section }: { section: BulletinSection }) {
  const link = BULLETIN_SECTION_LINKS[section.key];
  const headers = section.rows?.length ? Object.keys(section.rows[0]) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{section.title}</CardTitle>
        {link && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={link}>Open module <ExternalLink className="ml-1 h-3 w-3" /></Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {section.kpis.map((k) => (
            <div key={k.label} className="min-w-[110px] rounded-lg border px-3 py-2">
              <p className="text-lg font-semibold">
                {k.value}
                <Delta delta={k.delta} />
              </p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>
        {headers.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.rows!.map((row, i) => (
                  <TableRow key={i}>
                    {headers.map((h) => (
                      <TableCell key={h} className="max-w-sm truncate text-sm">{String(row[h] ?? '')}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BulletinDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['bulletin', id],
    queryFn: () => fetchBulletin(id),
    enabled: !!id,
  });

  const download = useMutation({ mutationFn: () => downloadBulletinPdf(id) });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading bulletin…</p>;
  if (!data) return <p className="p-6 text-sm text-muted-foreground">Bulletin not found.</p>;

  const sections = (data.sections ?? []) as BulletinSection[];
  const editionLabel = data.edition.charAt(0).toUpperCase() + data.edition.slice(1);

  return (
    <>
      <PageHeader
        title={`${editionLabel} Bulletin`}
        description={new Date(data.date).toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="gold" onClick={() => download.mutate()} disabled={download.isPending}>
              <Download className="mr-2 h-4 w-4" /> {download.isPending ? 'Preparing…' : 'Download PDF'}
            </Button>
            <Button variant="outline" asChild><Link href="/bulletin">Archive</Link></Button>
          </div>
        }
      />

      {data.narrative && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="whitespace-pre-line text-sm">{data.narrative}</p>
            {data.narrativeTe && (
              <p className="whitespace-pre-line border-t pt-3 text-sm text-muted-foreground">{data.narrativeTe}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => <SectionCard key={s.key} section={s} />)}
      </div>
    </>
  );
}
