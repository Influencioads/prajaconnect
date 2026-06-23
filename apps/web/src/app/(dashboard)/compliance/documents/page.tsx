'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createComplianceDocument,
  deleteComplianceDocument,
  fetchComplianceDocuments,
  fetchLegalNotices,
  fetchPermissionRequests,
  uploadComplianceFile,
} from '@/lib/compliance';
import { useAuth } from '@/lib/auth';

export default function ComplianceDocumentsPage() {
  const [page, setPage] = React.useState(1);
  const [file, setFile] = React.useState<File | null>(null);
  const [linkType, setLinkType] = React.useState<'permission' | 'notice'>('permission');
  const [linkId, setLinkId] = React.useState('');
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('compliance'));
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-documents', page],
    queryFn: () => fetchComplianceDocuments({ page, limit: 20 }),
  });

  const { data: permissions } = useQuery({
    queryKey: ['compliance-permissions-select'],
    queryFn: () => fetchPermissionRequests({ page: 1, limit: 100 }),
  });

  const { data: notices } = useQuery({
    queryKey: ['compliance-notices-select'],
    queryFn: () => fetchLegalNotices({ page: 1, limit: 100 }),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !linkId) throw new Error('File and link required');
      const uploaded = await uploadComplianceFile(file);
      return createComplianceDocument({
        fileUrl: uploaded.url,
        fileName: file.name,
        permissionRequestId: linkType === 'permission' ? linkId : undefined,
        legalNoticeId: linkType === 'notice' ? linkId : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-documents'] });
      setFile(null);
      setLinkId('');
    },
  });

  const remove = useMutation({
    mutationFn: deleteComplianceDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance-documents'] }),
  });

  return (
    <>
      <PageHeader title="Compliance Documents" description="Permission letters, legal notices, and supporting files." />

      {canEdit && (
        <div className="mb-4 max-w-lg space-y-3 rounded-lg border p-4">
          <div>
            <Label>Link to</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={linkType} onChange={(e) => { setLinkType(e.target.value as 'permission' | 'notice'); setLinkId(''); }}>
              <option value="permission">Permission Request</option>
              <option value="notice">Legal Notice</option>
            </select>
          </div>
          <div>
            <Label>{linkType === 'permission' ? 'Permission' : 'Notice'}</Label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={linkId} onChange={(e) => setLinkId(e.target.value)}>
              <option value="">Select…</option>
              {linkType === 'permission'
                ? (permissions?.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)
                : (notices?.data ?? []).map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          </div>
          <div>
            <Label>File</Label>
            <Input type="file" className="mt-1" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button disabled={!file || !linkId || upload.isPending} onClick={() => upload.mutate()}>
            {upload.isPending ? 'Uploading…' : 'Upload & Link'}
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Linked To</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-navy hover:underline">
                    {d.fileName ?? 'Document'}
                  </a>
                </TableCell>
                <TableCell>
                  {d.permissionRequest?.title ?? d.legalNotice?.title ?? '—'}
                </TableCell>
                <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {canEdit && <Button size="sm" variant="outline" onClick={() => remove.mutate(d.id)}>Delete</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
    </>
  );
}
