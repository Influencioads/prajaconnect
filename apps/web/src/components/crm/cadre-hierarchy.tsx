'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { fetchCadreHierarchy, type CadreHierarchyNode } from '@/lib/crm';

export function CadreHierarchy() {
  const { data, isLoading } = useQuery({
    queryKey: ['cadre-hierarchy'],
    queryFn: fetchCadreHierarchy,
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  if (!data?.length) return <EmptyState title="No hierarchy data" />;

  return (
    <div className="space-y-2">
      {data.map((node) => (
        <HierarchyNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}

function HierarchyNode({ node, depth }: { node: CadreHierarchyNode; depth: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
        style={{ marginLeft: depth * 20 }}
      >
        {depth > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <Link
          href={`/cadre/${node.id}`}
          className="font-semibold text-foreground hover:text-primary"
        >
          {node.name}
        </Link>
        <span className="text-sm text-muted-foreground">· {node.designation}</span>
        <Badge variant="muted">{node.level}</Badge>
        {node.mandal?.name && (
          <span className="text-xs text-muted-foreground">{node.mandal.name}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {node._count.children > 0 && (
            <span className="text-xs text-muted-foreground">{node._count.children} reports</span>
          )}
          <StatusBadge status={node.status} />
        </div>
      </div>
      {node.children?.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <HierarchyNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
