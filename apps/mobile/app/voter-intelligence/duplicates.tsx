import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterDuplicates, reviewVoterDuplicate } from '../../lib/voter-intelligence';
import { Screen, Card, ScreenHeader, Badge, PrimaryButton, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function VoterDuplicatesMobile() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['m-voter-dup'],
    queryFn: () => fetchVoterDuplicates({ page: 1, limit: 30, status: 'Pending' }),
  });

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => reviewVoterDuplicate(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m-voter-dup'] }),
  });

  return (
    <Screen>
      <ScreenHeader title="Duplicate Review" subtitle="Confirm or reject possible matches" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {(data?.data ?? []).map((d: {
          id: string; matchScore: number; matchReason?: string;
          citizenA: { name: string; voterId?: string };
          citizenB: { name: string; voterId?: string };
        }) => (
          <Card key={d.id} className="mb-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 pr-2 text-[15px] font-bold text-ink" numberOfLines={1}>
                {d.citizenA.name} ↔ {d.citizenB.name}
              </Text>
              <Badge label={`Score ${d.matchScore}`} color={colors.warning} />
            </View>
            {d.matchReason ? <Text className="mt-0.5 text-xs text-muted">{d.matchReason}</Text> : null}
            <View className="mt-3 flex-row gap-2">
              <PrimaryButton
                label="Confirm"
                variant="gold"
                small
                icon="checkmark-circle"
                className="flex-1"
                onPress={() => review.mutate({ id: d.id, status: 'Confirmed' })}
              />
              <PrimaryButton
                label="Reject"
                variant="outline"
                small
                icon="close-circle"
                className="flex-1"
                onPress={() => review.mutate({ id: d.id, status: 'Rejected' })}
              />
            </View>
          </Card>
        ))}
        {!data?.data?.length ? (
          <EmptyState title="No pending duplicates" subtitle="New possible matches will appear here." icon="duplicate" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
