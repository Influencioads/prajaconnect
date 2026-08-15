import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, KpiTile, MenuRow, Loading, type IconName } from '../../components/ui';
import { fetchAssetStats, MOBILE_ASSET_LIST } from '../../lib/assets';
import { colors } from '../../lib/theme';

const CATEGORY_META: Record<string, { icon: IconName; tint: string }> = {
  roads: { icon: 'trail-sign', tint: colors.navy },
  taxes: { icon: 'cash', tint: colors.success },
  'religious-places': { icon: 'star', tint: colors.violet },
  'total-works': { icon: 'construct', tint: colors.info },
  'dealer-shops': { icon: 'pricetag', tint: colors.teal },
  'burial-grounds': { icon: 'flag', tint: colors.muted },
  hospitals: { icon: 'medkit', tint: colors.danger },
  schools: { icon: 'school', tint: colors.info },
  'mepma-dwcra': { icon: 'people', tint: colors.violet },
  tanks: { icon: 'water', tint: colors.teal },
  rws: { icon: 'water', tint: colors.info },
  'green-ambassadors': { icon: 'leaf', tint: colors.success },
  'government-offices': { icon: 'business', tint: colors.navy },
};

export default function AssetsDashboard() {
  const router = useRouter();
  const { data: stats, isLoading } = useQuery({ queryKey: ['m-asset-stats'], queryFn: () => fetchAssetStats() });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Assets" subtitle="Constituency infrastructure & facilities" onBack={() => router.back()} />

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <View className="flex-row gap-3">
              <KpiTile label="Total Assets" value={stats?.total ?? 0} accent={colors.navy} icon="layers" />
              <KpiTile label="Active" value={stats?.byStatus?.Active ?? 0} accent={colors.success} icon="checkmark-circle" />
            </View>
            <View className="flex-row gap-3">
              <KpiTile label="Maintenance" value={stats?.underMaintenance ?? 0} accent={colors.warning} icon="construct" />
              <KpiTile label="Development" value={stats?.underDevelopment ?? 0} accent={colors.info} icon="trending-up" />
            </View>

            <View className="mt-2">
              {MOBILE_ASSET_LIST.map((c) => {
                const count = stats?.byCategory?.[c.category] ?? 0;
                const meta = CATEGORY_META[c.slug] ?? { icon: 'business' as IconName, tint: colors.navy };
                return (
                  <MenuRow
                    key={c.slug}
                    label={c.label}
                    description={`${count} ${count === 1 ? 'asset' : 'assets'}`}
                    icon={meta.icon}
                    tint={meta.tint}
                    onPress={() => router.push(`/assets/${c.slug}`)}
                  />
                );
              })}
            </View>
            <View className="h-6" />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
