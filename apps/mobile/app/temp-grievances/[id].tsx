import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchTempGrievance, fetchTempGrievanceDuplicates } from '../../lib/crm';
import { colors } from '../../lib/theme';
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
            <View className="flex-row items-center">
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text className="ml-1.5 font-bold text-amber-800">Duplicate Warning</Text>
            </View>
            {matches.slice(0, 2).map((m: { ticketId?: string; matchScore: number; matchReason: string }, i: number) => (
              <Text key={i} className="mt-1 text-sm text-amber-900">{m.ticketId ?? 'Match'} — {m.matchScore}% · {m.matchReason}</Text>
            ))}
            {canAct && (
              <PrimaryButton
                label="Review Duplicates"
                icon="duplicate"
                variant="outline"
                small
                className="mt-3"
                onPress={() => router.push(`/temp-grievances/duplicate?id=${id}`)}
              />
            )}
          </Card>
        )}

        <Card className="mb-3">
          <View className="flex-row items-center">
            <Ionicons name="person" size={15} color={colors.info} />
            <Text className="ml-1.5 font-bold text-navy">Citizen</Text>
          </View>
          <Text className="mt-1 text-sm text-ink">{data.citizenName ?? '—'} · {data.mobileNumber ?? '—'}</Text>
          <Text className="mt-1 text-sm text-muted">{data.village?.name ?? ''}{data.mandal?.name ? `, ${data.mandal.name}` : ''}</Text>
        </Card>

        <Card className="mb-3">
          <View className="flex-row items-center">
            <Ionicons name="document-text" size={15} color={colors.navy} />
            <Text className="ml-1.5 font-bold text-navy">Issue</Text>
          </View>
          <Text className="mt-1 text-sm text-ink">{data.issueDescription ?? data.originalMessage ?? '—'}</Text>
          <Text className="mt-2 text-xs text-muted">Source: {data.source}</Text>
        </Card>

        {canAct && (
          <View className="gap-2">
            <PrimaryButton label="Validate" icon="shield-checkmark" onPress={() => router.push(`/temp-grievances/validate?id=${id}`)} />
            <PrimaryButton label="Convert to Grievance" icon="arrow-up-circle" variant="gold" onPress={() => router.push(`/temp-grievances/convert?id=${id}`)} />
            <PrimaryButton label="Request More Info" icon="send" variant="outline" onPress={() => router.push(`/temp-grievances/request-info?id=${id}`)} />
          </View>
        )}

        {data.convertedGrievance && (
          <Card className="mt-3">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text className="ml-1.5 text-sm text-ink">Converted to {data.convertedGrievance.code}</Text>
            </View>
          </Card>
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
