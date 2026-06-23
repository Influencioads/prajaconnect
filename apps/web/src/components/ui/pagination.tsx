import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export function Pagination({
  page,
  totalPages,
  total = 0,
  onPage,
  onChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onPage?: (page: number) => void;
  onChange?: (page: number) => void;
}) {
  const setPage = onPage ?? onChange;
  if (!setPage || totalPages <= 1 && total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total.toLocaleString('en-IN')} records
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
