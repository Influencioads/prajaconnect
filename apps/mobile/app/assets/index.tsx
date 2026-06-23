import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, KpiTile, MenuRow, Loading } from '../../components/ui';
import { fetchAssetStats, MOBILE_ASSET_LIST } from '../../lib/assets';
import { colors } from '../../lib/theme';

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
              <KpiTile label="Total Assets" value={stats?.total ?? 0} accent={colors.navy} />
              <KpiTile label="Active" value={stats?.byStatus?.Active ?? 0} accent={colors.success} />
            </View>
            <View className="flex-row gap-3">
              <KpiTile label="Maintenance" value={stats?.underMaintenance ?? 0} accent={colors.warning} />
              <KpiTile label="Development" value={stats?.underDevelopment ?? 0} accent={'#2563EB'} />
            </View>

            <View className="mt-2">
              {MOBILE_ASSET_LIST.map((c) => {
                const count = stats?.byCategory?.[c.category] ?? 0;
                return (
                  <MenuRow
                    key={c.slug}
                    label={c.label}
                    description={`${count} ${count === 1 ? 'asset' : 'assets'}`}
                    onPress={() => router.push(`/assets/${c.slug}`)}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
