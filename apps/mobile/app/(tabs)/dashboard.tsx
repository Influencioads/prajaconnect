import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { fetchDashboard } from '../../lib/crm';
import { Screen, ScreenHeader, KpiTile, Card, StatusPill, Loading, EmptyState, ErrorState } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['m-dashboard'],
    queryFn: fetchDashboard,
  });

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <ScreenHeader title={`Hello, ${user?.name?.split(' ')[0] ?? ''}`} subtitle={user?.roleLabel} />

        {isError ? (
          <ErrorState title="Couldn’t load dashboard" onRetry={refetch} />
        ) : isLoading || !data ? (
          <Loading />
        ) : (
          <>
            <View className="flex-row gap-3">
              <KpiTile label="Citizens" value={data.kpis.citizens} accent={colors.navy} />
              <KpiTile label="Cadre" value={data.kpis.cadre} hint={`${data.kpis.activeCadre} active`} accent={colors.gold} />
            </View>
            <View className="flex-row gap-3">
              <KpiTile label="Open grievances" value={data.kpis.grievancesOpen} hint={`${data.kpis.grievancesTotal} total`} accent={colors.danger} />
              <KpiTile label="Resolved" value={`${data.kpis.resolutionRate}%`} hint={`${data.kpis.grievancesResolved} closed`} accent={colors.success} />
            </View>
            <View className="flex-row gap-3">
              <KpiTile label="Beneficiaries" value={data.kpis.beneficiaries} accent="#7C3AED" />
              <KpiTile label="Events" value={data.kpis.events} accent="#0891B2" />
            </View>

            <Text className="mb-2 mt-2 text-sm font-bold text-gray-500">Recent grievances</Text>
            {data.recentGrievances.length === 0 ? (
              <EmptyState title="No grievances yet" />
            ) : (
              data.recentGrievances.slice(0, 6).map((g) => (
                <Pressable key={g.id} onPress={() => router.push(`/grievance/${g.id}`)}>
                  <Card className="mb-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 pr-2 text-base font-semibold text-navy" numberOfLines={1}>
                        {g.title}
                      </Text>
                      <StatusPill status={g.status} />
                    </View>
                    <Text className="mt-1 text-xs text-gray-500">
                      {g.code}
                      {g.mandal ? ` · ${g.mandal}` : ''}
                      {g.citizen ? ` · ${g.citizen}` : ''}
                    </Text>
                  </Card>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
