import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWarRoomDashboard, fetchWarRoomAlerts, resolveWarRoomAlert } from '../../lib/war-room';
import { Screen, Card, ScreenHeader, KpiTile, Badge, EmptyState, PrimaryButton, SectionTitle } from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

export default function WarRoomMobile() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['m-war-dash'], queryFn: fetchWarRoomDashboard });
  const { data: alerts } = useQuery({ queryKey: ['m-war-alerts'], queryFn: () => fetchWarRoomAlerts({ page: 1, limit: 10, resolved: 'false' }) });

  const resolve = useMutation({
    mutationFn: resolveWarRoomAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m-war-alerts'] }),
  });

  return (
    <Screen>
      <ScreenHeader title="War Room" subtitle="Live campaign command" onBack={() => router.back()} />
      <View className="mt-1 flex-row gap-3">
        <KpiTile label="Open alerts" value={data?.openAlerts ?? 0} icon="warning" accent={colors.danger} />
        <KpiTile label="Escalations" value={data?.openEscalations ?? 0} icon="arrow-up-circle" accent={colors.warning} />
      </View>
      <PrimaryButton
        label="View All Alerts"
        icon="notifications"
        variant="outline"
        onPress={() => router.push('/war-room/alerts')}
      />
      <PrimaryButton
        label="View Escalations"
        icon="trending-up"
        variant="outline"
        className="mt-2"
        onPress={() => router.push('/war-room/escalations')}
      />
      <SectionTitle>Latest alerts</SectionTitle>
      <ScrollView>
        {(alerts?.data ?? []).map((a: { id: string; title: string; severity: string }) => (
          <Card key={a.id} className="mb-2">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 pr-2 font-semibold" style={{ color: colors.navy }}>{a.title}</Text>
              <Badge label={a.severity} color={statusColor[a.severity] ?? colors.navy} dot />
            </View>
            <PrimaryButton
              label="Resolve"
              icon="checkmark-circle"
              variant="gold"
              small
              onPress={() => resolve.mutate(a.id)}
              className="mt-3 self-start"
            />
          </Card>
        ))}
        {!alerts?.data?.length ? (
          <EmptyState icon="shield-checkmark" title="No open alerts" subtitle="All clear on the ground." />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
