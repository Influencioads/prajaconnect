import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTempGrievanceDuplicates } from '../../lib/crm';
import { colors } from '../../lib/theme';
import { Screen, ScreenHeader, Card, Loading, EmptyState, Badge, IconBubble } from '../../components/ui';

export default function DuplicateWarning() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ['m-temp-dups', id], queryFn: () => fetchTempGrievanceDuplicates(id!) });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <ScrollView>
        <ScreenHeader title="Duplicate Warning" subtitle="Possible matching records" onBack={() => router.back()} />
        {(data?.matches ?? []).map((m: { ticketId: string; matchScore: number; matchReason: string; grievanceId?: string }, i: number) => (
          <Card key={i} className="mb-3">
            <View className="flex-row items-center">
              <IconBubble icon="duplicate" tint={colors.warning} size={38} />
              <View className="ml-3 flex-1 pr-2">
                <Text className="font-bold text-navy">{m.ticketId}</Text>
                <Text className="mt-0.5 text-sm text-muted">{m.matchReason}</Text>
              </View>
              <Badge label={`${m.matchScore}% match`} color={colors.warning} />
            </View>
          </Card>
        ))}
        {!data?.matches?.length && (
          <EmptyState title="No duplicates" subtitle="No duplicate matches found for this record." icon="checkmark-done" />
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
