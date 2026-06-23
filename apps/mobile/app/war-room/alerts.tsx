import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWarRoomAlerts, resolveWarRoomAlert } from '../../lib/war-room';
import { Screen, Card, ScreenHeader, Badge } from '../../components/ui';
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
      <ScreenHeader title="War Room Alerts" onBack={() => router.back()} />
      <ScrollView className="mt-4">
        {(data?.data ?? []).map((a: { id: string; title: string; severity: string; description?: string }) => (
          <Card key={a.id} className="mb-2">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="flex-1 font-semibold text-navy">{a.title}</Text>
              <Badge label={a.severity} color={statusColor[a.severity] ?? colors.navy} />
            </View>
            {a.description ? <Text className="text-sm text-slate-500">{a.description}</Text> : null}
            <Pressable
              onPress={() => resolve.mutate(a.id)}
              disabled={resolve.isPending}
              className="mt-2 self-start rounded bg-gold px-3 py-1"
            >
              <Text style={{ color: colors.navy, fontSize: 12, fontWeight: '600' }}>
                {resolve.isPending ? 'Resolving…' : 'Resolve'}
              </Text>
            </Pressable>
          </Card>
        ))}
        {!data?.data?.length ? <Text className="text-sm text-gray-400">No open alerts.</Text> : null}
      </ScrollView>
    </Screen>
  );
}
