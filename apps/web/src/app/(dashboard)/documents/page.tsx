'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, FolderOpen, Tags } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { downloadDocumentsReport, fetchDocumentsDashboard } from '@/lib/documents';

export default function DocumentsDashboardPage() {
  const { data } = useQuery({
    queryKey: ['documents-dashboard'],
    queryFn: fetchDocumentsDashboard,
  });

  return (
    <>
      <PageHeader
        title="Document Management"
        description="Central file library with role-based access."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/documents/library">Library</Link></Button>
            <Button variant="outline" asChild><Link href="/documents/categories">Categories</Link></Button>
            <Button variant="gold" onClick={() => downloadDocumentsReport('files')}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Folders" value={data?.folderCount ?? 0} icon={FolderOpen} accent="bg-navy/10 text-navy" />
        <KpiCard label="Files" value={data?.fileCount ?? 0} icon={FileText} accent="bg-gold/20 text-navy" />
        <KpiCard label="Categories" value={data?.categoryCount ?? 0} icon={Tags} accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Files</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/documents/library">Browse library</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentFiles ?? []).map((f: { id: string; name: string; folder?: { name: string }; createdAt: string }) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{f.name}</span>
                  <p className="text-xs text-muted-foreground">{f.folder?.name ?? 'Root'}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {!data?.recentFiles?.length && <p className="text-sm text-muted-foreground">No files yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Access</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentAccess ?? []).map((a: { id: string; action: string; file?: { name: string }; user?: { name: string }; createdAt: string }) => (
              <div key={a.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.file?.name ?? 'File'}</span>
                  <span className="text-xs capitalize text-muted-foreground">{a.action}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.user?.name ?? 'Unknown'} · {new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!data?.recentAccess?.length && <p className="text-sm text-muted-foreground">No access logs yet</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
