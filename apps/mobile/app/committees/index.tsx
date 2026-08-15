import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, KpiTile, MenuRow, Loading, type IconName } from '../../components/ui';
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

const SECTION_META: Record<string, { icon: IconName; tint: string }> = {
  'mandal-committee': { icon: 'people', tint: colors.navy },
  'village-committee': { icon: 'home', tint: colors.success },
  'coordination-committee': { icon: 'git-network', tint: colors.info },
  'mandal-coordination-committee': { icon: 'git-branch', tint: colors.info },
  observers: { icon: 'search', tint: colors.warning },
  'imp-leaders': { icon: 'ribbon', tint: colors.violet },
  influencers: { icon: 'star', tint: colors.gold },
  press: { icon: 'newspaper', tint: colors.teal },
};

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
              <KpiTile label="Total Network" value={data.totals.totalNetwork} accent={colors.navy} icon="git-network" />
              <KpiTile label="Active" value={data.activeVsInactive.active} accent={colors.success} icon="checkmark-circle" />
              <KpiTile label="Inactive" value={data.activeVsInactive.inactive} accent={colors.danger} icon="close-circle" />
            </View>
            <View className="mb-3 flex-row gap-3">
              <KpiTile label="Committee Members" value={data.totals.committeeMembers} accent={colors.gold} icon="people" />
              <KpiTile label="Observers" value={data.totals.observers} accent={colors.warning} icon="search" />
              <KpiTile label="IMP Leaders" value={data.totals.impLeaders} accent={colors.violet} icon="ribbon" />
            </View>
            <View className="mb-3 flex-row gap-3">
              <KpiTile label="Influencers" value={data.totals.influencers} accent={colors.gold} icon="star" />
              <KpiTile label="Press" value={data.totals.press} accent={colors.teal} icon="newspaper" />
              <KpiTile label="Mandal Comm." value={data.totals.mandalCommittee} accent={colors.navy} icon="business" />
            </View>

            {SECTIONS.map((key) => {
              const v = NETWORK_VIEWS[key];
              const meta = SECTION_META[key];
              return (
                <MenuRow
                  key={key}
                  label={v.title}
                  description={v.subtitle}
                  icon={meta?.icon}
                  tint={meta?.tint}
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
