import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTempGrievance, fetchTempGrievanceDuplicates } from '../../lib/crm';
import { Screen, ScreenHeader, Card, StatusPill, PrimaryButton, Loading } from '../../components/ui';

export default function TempGrievanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({ queryKey: ['m-temp-detail', id], queryFn: () => fetchTempGrievance(id!) });
  const { data: dups } = useQuery({ queryKey: ['m-temp-dups', id], queryFn: () => fetchTempGrievanceDuplicates(id!), enabled: !!id });

  if (isLoading || !data) return <Loading />;

  const matches = dups?.matches ?? data.duplicates ?? [];
  const canAct = !['Converted', 'Rejected', 'Archived', 'Duplicate'].includes(data.validationStatus);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title={data.tempTicketId} subtitle={data.issueSummary ?? data.issueCategory ?? ''} onBack={() => router.back()} />
        <View className="mb-3 flex-row gap-2">
          <StatusPill status={data.validationStatus} />
          <StatusPill status={data.priority} />
        </View>

        {matches.length > 0 && (
          <Card className="mb-3 border-amber-200 bg-amber-50">
            <Text className="font-bold text-amber-800">Duplicate Warning</Text>
            {matches.slice(0, 2).map((m: { ticketId?: string; matchScore: number; matchReason: string }, i: number) => (
              <Text key={i} className="mt-1 text-sm text-amber-900">{m.ticketId ?? 'Match'} — {m.matchScore}% · {m.matchReason}</Text>
            ))}
            {canAct && <PrimaryButton label="Review Duplicates" onPress={() => router.push(`/temp-grievances/duplicate?id=${id}`)} />}
          </Card>
        )}

        <Card className="mb-3">
          <Text className="font-bold text-navy">Citizen</Text>
          <Text className="mt-1 text-sm">{data.citizenName ?? '—'} · {data.mobileNumber ?? '—'}</Text>
          <Text className="mt-1 text-sm text-gray-500">{data.village?.name ?? ''}{data.mandal?.name ? `, ${data.mandal.name}` : ''}</Text>
        </Card>

        <Card className="mb-3">
          <Text className="font-bold text-navy">Issue</Text>
          <Text className="mt-1 text-sm">{data.issueDescription ?? data.originalMessage ?? '—'}</Text>
          <Text className="mt-2 text-xs text-gray-500">Source: {data.source}</Text>
        </Card>

        {canAct && (
          <View className="gap-2">
            <PrimaryButton label="Validate" onPress={() => router.push(`/temp-grievances/validate?id=${id}`)} />
            <PrimaryButton label="Convert to Grievance" onPress={() => router.push(`/temp-grievances/convert?id=${id}`)} />
            <PrimaryButton label="Request More Info" onPress={() => router.push(`/temp-grievances/request-info?id=${id}`)} />
          </View>
        )}

        {data.convertedGrievance && (
          <Card className="mt-3">
            <Text className="text-sm">Converted to {data.convertedGrievance.code}</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
