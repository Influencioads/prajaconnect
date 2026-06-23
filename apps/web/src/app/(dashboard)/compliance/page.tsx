'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Download, FileText, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  downloadExpenseComplianceReport,
  fetchComplianceDashboard,
  fetchExpenseComplianceReport,
  formatCurrency,
} from '@/lib/compliance';

export default function ComplianceDashboardPage() {
  const { data } = useQuery({ queryKey: ['compliance-dashboard'], queryFn: fetchComplianceDashboard });
  const { data: expenseReport } = useQuery({
    queryKey: ['compliance-expense-report'],
    queryFn: fetchExpenseComplianceReport,
  });

  return (
    <>
      <PageHeader
        title="Legal & Election Compliance"
        description="Permissions, checklists, legal notices, documents, and compliance alerts."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href="/compliance/permissions">Permissions</Link></Button>
            <Button variant="outline" asChild><Link href="/compliance/checklists">Checklists</Link></Button>
            <Button variant="outline" asChild><Link href="/compliance/notices">Legal Notices</Link></Button>
            <Button variant="gold" onClick={() => downloadExpenseComplianceReport()}>
              <Download className="mr-2 h-4 w-4" /> Expense Report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Pending Permissions" value={data?.pendingPermissions ?? 0} icon={ShieldAlert} accent="bg-amber-100 text-amber-700" />
        <KpiCard label="Approved Permissions" value={data?.approvedPermissions ?? 0} accent="bg-green-100 text-green-800" />
        <KpiCard label="Open Alerts" value={data?.openAlerts ?? 0} accent="bg-red-100 text-red-700" />
        <KpiCard label="Open Notices" value={data?.openNotices ?? 0} accent="bg-navy/10 text-navy" />
        <KpiCard label="Documents" value={data?.documentCount ?? 0} icon={FileText} accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Checklist Progress</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/compliance/checklists">Manage</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.checklistStats ?? []).map((c) => (
              <div key={c.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span>{c.completionPct}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.completed} of {c.total} items complete</p>
              </div>
            ))}
            {!data?.checklistStats?.length && <p className="text-sm text-muted-foreground">No checklists yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Permission Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/compliance/permissions">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recentRequests ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <Link href={`/compliance/permissions?id=${r.id}`} className="font-medium text-navy hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{r.type}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {expenseReport?.election && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Expense Compliance — {expenseReport.election.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div><p className="text-xs text-muted-foreground">Total Expenses</p><p className="text-lg font-semibold">{expenseReport.summary.totalExpenses}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Amount</p><p className="text-lg font-semibold">{formatCurrency(expenseReport.summary.totalAmount)}</p></div>
                <div><p className="text-xs text-muted-foreground">Pending Approval</p><p className="text-lg font-semibold">{expenseReport.summary.pendingApproval}</p></div>
                <div><p className="text-xs text-muted-foreground">Missing Receipts</p><p className="text-lg font-semibold text-red-600">{expenseReport.summary.missingReceipts}</p></div>
                <div><p className="text-xs text-muted-foreground">Approved Amount</p><p className="text-lg font-semibold">{formatCurrency(expenseReport.summary.approvedAmount)}</p></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
