'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import {
  addAssetDocument,
  addAssetPhoto,
  removeAssetDocument,
  removeAssetPhoto,
  uploadFile,
  type AssetDocumentItem,
  type AssetPhotoItem,
} from '@/lib/crm';

export function AssetPhotos({
  assetId,
  photos,
  canEdit,
}: {
  assetId: string;
  photos: AssetPhotoItem[];
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { url, mimeType, size } = await uploadFile(file);
      return addAssetPhoto(assetId, { url, label: file.name, mimeType, size });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', assetId] });
      toast({ title: 'Photo uploaded', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Upload failed', description: apiError(err), variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (photoId: string) => removeAssetPhoto(assetId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset', assetId] }),
  });

  return (
    <div className="space-y-3">
      {canEdit && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
              e.target.value = '';
            }}
          />
          <Button variant="outline" size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> {upload.isPending ? 'Uploading…' : 'Upload photo'}
          </Button>
        </div>
      )}
      {!photos.length ? (
        <EmptyState title="No photos" description="Upload site photos for this asset." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.label ?? 'Asset photo'} className="h-32 w-full object-cover" />
              {canEdit && (
                <button
                  onClick={() => remove.mutate(p.id)}
                  className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetDocuments({
  assetId,
  documents,
  canEdit,
}: {
  assetId: string;
  documents: AssetDocumentItem[];
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { url, mimeType, size } = await uploadFile(file);
      return addAssetDocument(assetId, { url, label: file.name, mimeType, size });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', assetId] });
      toast({ title: 'Document uploaded', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Upload failed', description: apiError(err), variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (docId: string) => removeAssetDocument(assetId, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset', assetId] }),
  });

  return (
    <div className="space-y-3">
      {canEdit && (
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
              e.target.value = '';
            }}
          />
          <Button variant="outline" size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> {upload.isPending ? 'Uploading…' : 'Upload document'}
          </Button>
        </div>
      )}
      {upload.isPending && <Spinner />}
      {!documents.length ? (
        <EmptyState title="No documents" description="Attach permits, reports or land records." />
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{d.label ?? 'Document'}</span>
              </div>
              <div className="flex items-center gap-1">
                <a href={d.url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                </a>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
