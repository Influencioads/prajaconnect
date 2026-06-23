import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, KpiTile, MenuRow, Loading } from '../../components/ui';
import { colors } from '../../lib/theme';
import { fetchCommitteeAnalytics, NETWORK_VIEWS } from '../../lib/network';

const SECTIONS = [
  'mandal-committee',
  'village-committee',
  'coordination-committee',
  'mandal-coordination-committee',
  'observers',
  'imp-leaders',
  'influencers',
  'press',
];

export default function CommitteesHome() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['m-committee-analytics'],
    queryFn: fetchCommitteeAnalytics,
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Committees & Network"
          subtitle="Committees, observers, leaders, influencers & press"
          onBack={() => router.back()}
        />

        {isLoading || !data ? (
          <Loading />
        ) : (
          <>
            <View className="mb-3 flex-row gap-3">
              <KpiTile label="Total Network" value={data.totals.totalNetwork} accent={colors.navy} />
              <KpiTile label="Active" value={data.activeVsInactive.active} accent="#16A34A" />
              <KpiTile label="Inactive" value={data.activeVsInactive.inactive} accent="#DC2626" />
            </View>
            <View className="mb-3 flex-row gap-3">
              <KpiTile label="Committee Members" value={data.totals.committeeMembers} accent={colors.gold} />
              <KpiTile label="Observers" value={data.totals.observers} accent="#D97706" />
              <KpiTile label="IMP Leaders" value={data.totals.impLeaders} accent="#7C3AED" />
            </View>
            <View className="mb-3 flex-row gap-3">
              <KpiTile label="Influencers" value={data.totals.influencers} accent="#DB2777" />
              <KpiTile label="Press" value={data.totals.press} accent="#0D9488" />
              <KpiTile label="Mandal Comm." value={data.totals.mandalCommittee} accent={colors.navy} />
            </View>

            {SECTIONS.map((key) => {
              const v = NETWORK_VIEWS[key];
              return (
                <MenuRow
                  key={key}
                  label={v.title}
                  description={v.subtitle}
                  onPress={() => router.push(`/committees/list?view=${key}`)}
                />
              );
            })}
            <View className="h-10" />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
