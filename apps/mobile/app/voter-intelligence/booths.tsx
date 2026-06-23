import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterBooths } from '../../lib/voter-intelligence';
import { Screen, Card, ScreenHeader, Badge } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function VoterBoothsMobile() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['m-voter-booths'],
    queryFn: () => fetchVoterBooths({ page: 1, limit: 30 }),
  });

  return (
    <Screen>
      <ScreenHeader title="Booth Strength" onBack={() => router.back()} />
      <ScrollView className="mt-4">
        {(data?.data ?? []).map((b: {
          id: string;
          supporterPct: number;
          strengthLabel: string;
          priorityBoothScore: number;
          booth: { number: string; village?: { name: string } };
        }) => (
          <Card key={b.id} className="mb-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold" style={{ color: colors.navy }}>Booth {b.booth.number}</Text>
              <Badge label={b.strengthLabel} color={colors.navy} />
            </View>
            <Text className="text-sm text-slate-500">{b.booth.village?.name ?? '—'}</Text>
            <Text className="text-sm">{b.supporterPct.toFixed(0)}% supporters · Priority {b.priorityBoothScore}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
