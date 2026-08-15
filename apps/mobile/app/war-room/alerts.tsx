import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWarRoomAlerts, resolveWarRoomAlert } from '../../lib/war-room';
import { Screen, Card, ScreenHeader, Badge, EmptyState, PrimaryButton } from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

export default function WarRoomAlerts() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['m-war-alerts-list'],
    queryFn: () => fetchWarRoomAlerts({ page: 1, limit: 30, resolved: 'false' }),
  });

  const resolve = useMutation({
    mutationFn: resolveWarRoomAlert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-war-alerts-list'] });
      qc.invalidateQueries({ queryKey: ['m-war-alerts'] });
      qc.invalidateQueries({ queryKey: ['m-war-dash'] });
    },
  });

  return (
    <Screen>
      <ScreenHeader title="War Room Alerts" subtitle="Open alerts needing action" onBack={() => router.back()} />
      <ScrollView className="mt-4">
        {(data?.data ?? []).map((a: { id: string; title: string; severity: string; description?: string }) => (
          <Card key={a.id} className="mb-2">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="flex-1 font-semibold" style={{ color: colors.navy }}>{a.title}</Text>
              <Badge label={a.severity} color={statusColor[a.severity] ?? colors.navy} dot />
            </View>
            {a.description ? <Text className="text-sm text-muted">{a.description}</Text> : null}
            <PrimaryButton
              label="Resolve"
              icon="checkmark-circle"
              variant="gold"
              small
              loading={resolve.isPending}
              onPress={() => resolve.mutate(a.id)}
              className="mt-3 self-start"
            />
          </Card>
        ))}
        {!data?.data?.length ? (
          <EmptyState icon="shield-checkmark" title="No open alerts" subtitle="All clear — nothing needs your attention right now." />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
