import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterBooths } from '../../lib/voter-intelligence';
import { Screen, ScreenHeader, ListRow, StatusPill, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function VoterBoothsMobile() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['m-voter-booths'],
    queryFn: () => fetchVoterBooths({ page: 1, limit: 30 }),
  });

  return (
    <Screen>
      <ScreenHeader title="Booth Strength" subtitle="Supporter share by booth" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {(data?.data ?? []).map((b: {
          id: string;
          supporterPct: number;
          strengthLabel: string;
          priorityBoothScore: number;
          booth: { number: string; village?: { name: string } };
        }) => (
          <ListRow
            key={b.id}
            title={`Booth ${b.booth.number}`}
            subtitle={`${b.booth.village?.name ?? '—'} · ${b.supporterPct.toFixed(0)}% supporters · Priority ${b.priorityBoothScore}`}
            icon="podium"
            tint={colors.info}
            right={<StatusPill status={b.strengthLabel} />}
          />
        ))}
        {!data?.data?.length ? (
          <EmptyState title="No booth data" subtitle="Booth strength scores will appear here." icon="podium" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
