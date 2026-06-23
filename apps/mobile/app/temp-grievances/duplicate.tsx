import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTempGrievanceDuplicates } from '../../lib/crm';
import { Screen, ScreenHeader, Card, Loading } from '../../components/ui';

export default function DuplicateWarning() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ['m-temp-dups', id], queryFn: () => fetchTempGrievanceDuplicates(id!) });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <ScrollView>
        <ScreenHeader title="Duplicate Warning" onBack={() => router.back()} />
        {(data?.matches ?? []).map((m: { ticketId: string; matchScore: number; matchReason: string; grievanceId?: string }, i: number) => (
          <Card key={i} className="mb-3">
            <Text className="font-bold text-navy">{m.ticketId}</Text>
            <Text className="mt-1 text-sm">{m.matchReason}</Text>
            <Text className="mt-1 text-sm font-semibold text-amber-700">{m.matchScore}% match</Text>
          </Card>
        ))}
        {!data?.matches?.length && <Text className="text-gray-500">No duplicate matches found.</Text>}
      </ScrollView>
    </Screen>
  );
}
