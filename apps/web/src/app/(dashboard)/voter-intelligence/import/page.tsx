'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { importVoterRoll } from '@/lib/voter-intelligence';

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return {
      epicNo: row.epicno || row.epic || row.voterid || cols[0],
      name: row.name || cols[1] || 'Unknown',
      relationName: row.relation || row.relationname,
      age: row.age ? Number(row.age) : undefined,
      partNo: row.partno || row.part,
      serialNo: row.serialno || row.serial,
      address: row.address,
    };
  });
}

export default function VoterImportPage() {
  const [csv, setCsv] = React.useState('');
  const [fileName, setFileName] = React.useState('import.csv');
  const [result, setResult] = React.useState<string | null>(null);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => importVoterRoll(fileName, parseCsv(csv)),
    onSuccess: (data) => {
      setResult(`Imported ${data.totalRows} rows — matched ${data.matched}, unmatched ${data.unmatched}`);
      qc.invalidateQueries({ queryKey: ['voter-dashboard'] });
    },
  });

  return (
    <>
      <PageHeader title="Import Electoral Roll" description="Paste CSV with columns: epicNo, name, relation, age, partNo, serialNo, address" />
      <Card>
        <CardHeader><CardTitle>CSV Import</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="File name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          <textarea
            className="min-h-[200px] w-full rounded-lg border p-3 text-sm"
            placeholder="epicNo,name,relation,age&#10;ABC1234567,Rama Rao,S/o Venkat,45"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
          <Button variant="gold" onClick={() => mutation.mutate()} disabled={!csv.trim() || mutation.isPending}>
            {mutation.isPending ? 'Importing…' : 'Import roll'}
          </Button>
          {result && <p className="text-sm text-green-700">{result}</p>}
        </CardContent>
      </Card>
    </>
  );
}
