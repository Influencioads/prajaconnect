'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { fetchFolderTree } from '@/lib/documents';

type FolderNode = {
  id: string;
  name: string;
  permissionLevel: string;
  _count: { files: number };
  category?: { name: string } | null;
  children?: FolderNode[];
};

function FolderNodeRow({ node, depth = 0 }: { node: FolderNode; depth?: number }) {
  return (
    <>
      <Link
        href={`/documents/${node.id}`}
        className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50"
        style={{ marginLeft: depth * 16 }}
      >
        <span className="font-medium">{node.name}</span>
        <span className="text-xs text-muted-foreground">
          {node._count.files} files · {node.category?.name ?? 'Uncategorized'} · {node.permissionLevel}
        </span>
      </Link>
      {(node.children ?? []).map((c) => (
        <FolderNodeRow key={c.id} node={c} depth={depth + 1} />
      ))}
    </>
  );
}

export default function DocumentsLibraryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['documents-folder-tree'],
    queryFn: fetchFolderTree,
  });

  return (
    <>
      <PageHeader
        title="Document Library"
        description="Browse folders and files with role-based access."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/documents/categories">Categories</Link></Button>
            <Button variant="outline" asChild><Link href="/documents">Dashboard</Link></Button>
          </div>
        }
      />
      <div className="space-y-2 rounded-lg border p-4">
        {isLoading ? <p>Loading folder tree…</p> : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No folders yet. Create one from a category or dashboard.</p>
        ) : (
          (data as FolderNode[]).map((node) => <FolderNodeRow key={node.id} node={node} />)
        )}
      </div>
    </>
  );
}
