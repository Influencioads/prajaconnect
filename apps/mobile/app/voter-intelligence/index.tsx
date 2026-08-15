import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterDashboard } from '../../lib/voter-intelligence';
import { Screen, ScreenHeader, KpiTile, PrimaryButton, ListRow, StatusPill, SectionTitle } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function VoterIntelligenceScreen() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-voter-dash'], queryFn: fetchVoterDashboard });

  return (
    <Screen>
      <ScreenHeader title="Voter Intelligence" subtitle="Field compact dashboard" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          <KpiTile label="Profiles" value={data?.totalProfiles ?? 0} icon="people" accent={colors.info} />
          <KpiTile label="Supporters" value={data?.supporters ?? 0} icon="ribbon" accent={colors.success} />
        </View>
        <View className="flex-row gap-3">
          <KpiTile label="Swing" value={data?.swings ?? 0} icon="trail-sign" accent={colors.warning} />
          <KpiTile label="Key" value={data?.keyVoters ?? 0} icon="star" accent={colors.violet} />
        </View>

        <PrimaryButton
          label="Tag Voters"
          variant="gold"
          icon="pricetag"
          className="mt-1"
          onPress={() => router.push('/voter-intelligence/profiles')}
        />
        <PrimaryButton
          label="Booth Strength"
          variant="outline"
          icon="podium"
          className="mt-2"
          onPress={() => router.push('/voter-intelligence/booths')}
        />
        <PrimaryButton
          label="Duplicate Review"
          variant="outline"
          icon="duplicate"
          className="mt-2"
          onPress={() => router.push('/voter-intelligence/duplicates')}
        />

        {data?.topPriorityBooths?.length ? <SectionTitle>Top priority booths</SectionTitle> : null}
        {(data?.topPriorityBooths ?? []).slice(0, 5).map((b: { id: string; priorityBoothScore: number; strengthLabel: string; booth: { number: string } }) => (
          <ListRow
            key={b.id}
            title={`Booth ${b.booth.number}`}
            subtitle={`Priority ${b.priorityBoothScore}`}
            icon="podium"
            tint={colors.info}
            right={<StatusPill status={b.strengthLabel} />}
          />
        ))}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
