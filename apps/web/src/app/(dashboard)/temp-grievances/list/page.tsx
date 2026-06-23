'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { TempGrievanceFormDialog } from '@/components/crm/temp-grievance-form-dialog';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { fetchGeoOptions, fetchTempGrievances } from '@/lib/crm';

const ALL = '__all__';
const SOURCES = ['Call', 'CampaignCall', 'ConferenceCall', 'WhatsApp', 'WhatsAppBot', 'D2DSurvey', 'Email', 'SMS', 'FieldVisit', 'VolunteerNote', 'Manual'];
const STATUSES = ['New', 'PendingValidation', 'MoreInfoRequired', 'Validated', 'Converted', 'Duplicate', 'Rejected', 'Archived'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function TempGrievancesListPage() {
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('tempgrievances'));

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [source, setSource] = React.useState(ALL);
  const [status, setStatus] = React.useState(ALL);
  const [priority, setPriority] = React.useState(ALL);
  const [mandalId, setMandalId] = React.useState(ALL);
  const [villageId, setVillageId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, source, status, priority, mandalId, villageId]);

  const { data: geo } = useQuery({ queryKey: ['geo'], queryFn: fetchGeoOptions });
  const villages = (geo?.villages ?? []).filter((v) => mandalId === ALL || v.mandalId === mandalId);

  const filters = {
    page,
    limit: 20,
    search: debounced || undefined,
    source: source === ALL ? undefined : source,
    status: status === ALL ? undefined : status,
    priority: priority === ALL ? undefined : priority,
    mandalId: mandalId === ALL ? undefined : mandalId,
    villageId: villageId === ALL ? undefined : villageId,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['temp-grievances', filters],
    queryFn: () => fetchTempGrievances(filters),
  });

  return (
    <>
      <PageHeader
        title="Temp Grievance List"
        description="All temporary grievances awaiting or completed validation."
        actions={canEdit ? <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Create</Button> : undefined}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search citizen, mobile, temp ID, issue..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={source} onValueChange={setSource}><SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All sources</SelectItem>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={priority} onValueChange={setPriority}><SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All priorities</SelectItem>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            <Select value={mandalId} onValueChange={(v) => { setMandalId(v); setVillageId(ALL); }}><SelectTrigger className="w-40"><SelectValue placeholder="Mandal" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All mandals</SelectItem>{(geo?.mandals ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
            <Select value={villageId} onValueChange={setVillageId}><SelectTrigger className="w-40"><SelectValue placeholder="Village" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All villages</SelectItem>{villages.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
          </div>

          {isLoading ? <Spinner className="mx-auto" /> : !data?.data.length ? (
            <EmptyState title="No temp grievances" description="Adjust filters or create a new record." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temp ID</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Citizen</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duplicate</TableHead>
                    <TableHead>Validator</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Link href={`/temp-grievances/${item.id}`} className="font-medium text-primary hover:underline">{item.tempTicketId}</Link></TableCell>
                      <TableCell>{item.source}</TableCell>
                      <TableCell><div>{item.citizenName ?? '—'}</div><div className="text-xs text-muted-foreground">{item.mobileNumber ?? ''}</div></TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.issueSummary ?? item.issueCategory ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={item.priority} /></TableCell>
                      <TableCell><StatusBadge status={item.validationStatus} /></TableCell>
                      <TableCell>{item.duplicateRisk !== 'None' ? `${item.duplicateRisk} (${item.duplicateRiskScore}%)` : '—'}</TableCell>
                      <TableCell>{item.assignedValidator?.name ?? '—'}</TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <TempGrievanceFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
