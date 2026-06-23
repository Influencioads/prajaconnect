'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
  deleteDocumentFile,
  fetchDocumentFiles,
  fetchDocumentFolders,
  uploadDocumentFile,
  viewDocumentFile,
} from '@/lib/documents';
import { useAuth } from '@/lib/auth';

export default function DocumentFolderPage() {
  const params = useParams();
  const folderId = params.folderId as string;
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const { accessLevel } = useAuth();
  const canEdit = ['edit', 'full'].includes(accessLevel('documents'));
  const qc = useQueryClient();

  const { data: subfolders } = useQuery({
    queryKey: ['documents-folders', folderId],
    queryFn: () => fetchDocumentFolders(folderId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['documents-files', folderId, page, search, tags],
    queryFn: () => fetchDocumentFiles({ folderId, page, limit: 20, search: search || undefined, tags: tags || undefined }),
  });

  const { data: preview } = useQuery({
    queryKey: ['documents-preview', previewId],
    queryFn: () => viewDocumentFile(previewId!),
    enabled: !!previewId,
  });

  const upload = useMutation({
    mutationFn: () => uploadDocumentFile(folderId, file!, tags || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents-files'] });
      setFile(null);
    },
  });

  const remove = useMutation({
    mutationFn: deleteDocumentFile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents-files'] }),
  });

  return (
    <>
      <PageHeader
        title="Folder"
        description="Files in this folder."
        actions={<Button variant="outline" asChild><Link href="/documents/library">All folders</Link></Button>}
      />

      {(subfolders ?? []).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(subfolders ?? []).map((f: { id: string; name: string }) => (
            <Button key={f.id} variant="outline" size="sm" asChild>
              <Link href={`/documents/${f.id}`}>{f.name}</Link>
            </Button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search files…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <Input placeholder="Filter tags…" value={tags} onChange={(e) => { setTags(e.target.value); setPage(1); }} className="max-w-xs" />
      </div>

      {canEdit && (
        <div className="mb-4 max-w-lg space-y-3 rounded-lg border p-4">
          <div>
            <Label>Upload file</Label>
            <Input type="file" className="mt-1" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : (data?.data ?? []).map((f: { id: string; name: string; mimeType?: string; tags?: string }) => (
              <TableRow key={f.id}>
                <TableCell>{f.name}</TableCell>
                <TableCell>{f.mimeType ?? '—'}</TableCell>
                <TableCell>{f.tags ?? '—'}</TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewId(f.id)}>Preview</Button>
                  {canEdit && <Button size="sm" variant="outline" onClick={() => remove.mutate(f.id)}>Delete</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPage={setPage} />}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewId(null)}>
          <div className="max-h-[90vh] max-w-3xl overflow-auto rounded-lg bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 font-semibold">{preview.name}</h3>
            {preview.mimeType?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.fileUrl} alt={preview.name} className="max-h-[70vh] w-full object-contain" />
            ) : preview.mimeType === 'application/pdf' ? (
              <iframe src={preview.fileUrl} title={preview.name} className="h-[70vh] w-full" />
            ) : (
              <a href={preview.fileUrl} target="_blank" rel="noreferrer" className="text-navy underline">Open file</a>
            )}
            <Button className="mt-4" variant="outline" onClick={() => setPreviewId(null)}>Close</Button>
          </div>
        </div>
      )}
    </>
  );
}
