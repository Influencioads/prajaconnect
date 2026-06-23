'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { fetchTempGrievanceReport } from '@/lib/crm';

export default function ValidatorPerformancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['temp-grievance-validator-report'],
    queryFn: () => fetchTempGrievanceReport('validator-performance'),
  });

  return (
    <>
      <PageHeader title="Validator Performance" description="Validation throughput and conversion by team member." />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Spinner className="mx-auto" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Validator</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Validated</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead>Rejected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.validators ?? []).map((v: { name: string; assigned: number; validated: number; converted: number; rejected: number }, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.assigned}</TableCell>
                    <TableCell>{v.validated}</TableCell>
                    <TableCell>{v.converted}</TableCell>
                    <TableCell>{v.rejected}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
