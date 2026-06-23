'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { apiError } from '@/lib/api';
import { importNetworkCsv, type NetworkResource } from '@/lib/crm';

export function CsvImportDialog({
  open,
  onOpenChange,
  resource,
  invalidateKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: NetworkResource;
  invalidateKey: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [csv, setCsv] = React.useState('');
  const [result, setResult] = React.useState<{ imported: number; skipped: number; errors: string[] } | null>(
    null,
  );

  React.useEffect(() => {
    if (open) {
      setCsv('');
      setResult(null);
    }
  }, [open]);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  };

  const mutation = useMutation({
    mutationFn: () => importNetworkCsv(resource, csv),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ['network', invalidateKey] });
      qc.invalidateQueries({ queryKey: ['network-stats', invalidateKey] });
      qc.invalidateQueries({ queryKey: ['committee-analytics'] });
      toast({
        title: 'Import complete',
        description: `${res.imported} imported, ${res.skipped} skipped`,
        variant: res.imported > 0 ? 'success' : 'error',
      });
    },
    onError: (err) => toast({ title: 'Import failed', description: apiError(err), variant: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file or paste CSV content. The first row must be headers (e.g.{' '}
            <span className="font-medium">Full Name, Mobile, Email, Status</span>). Rows missing a name or
            mobile are skipped.
          </p>

          <div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onFile(e.target.files?.[0])}
              className="block text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label>CSV content</Label>
            <Textarea
              rows={8}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={'Full Name,Mobile,Email,Status\nRavi Kumar,9876543210,ravi@praja.in,Active'}
              className="font-mono text-xs"
            />
          </div>

          {result && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">
                Imported {result.imported} · Skipped {result.skipped}
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-red-600">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled={!csv.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            <Upload className="h-4 w-4" /> {mutation.isPending ? 'Importing…' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
