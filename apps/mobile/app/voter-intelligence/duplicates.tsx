import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterDuplicates, reviewVoterDuplicate } from '../../lib/voter-intelligence';
import { Screen, Card, ScreenHeader } from '../../components/ui';
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
      <ScreenHeader title="Duplicate Review" onBack={() => router.back()} />
      <ScrollView className="mt-4">
        {(data?.data ?? []).map((d: {
          id: string; matchScore: number; matchReason?: string;
          citizenA: { name: string; voterId?: string };
          citizenB: { name: string; voterId?: string };
        }) => (
          <Card key={d.id} className="mb-2">
            <Text className="font-semibold">{d.citizenA.name} ↔ {d.citizenB.name}</Text>
            <Text className="text-xs text-slate-500">Score {d.matchScore} · {d.matchReason ?? ''}</Text>
            <View className="mt-2 flex-row gap-2">
              <Pressable onPress={() => review.mutate({ id: d.id, status: 'Confirmed' })} className="rounded bg-gold px-3 py-1">
                <Text style={{ color: colors.navy, fontSize: 12 }}>Confirm</Text>
              </Pressable>
              <Pressable onPress={() => review.mutate({ id: d.id, status: 'Rejected' })} className="rounded border px-3 py-1">
                <Text style={{ fontSize: 12 }}>Reject</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
