import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWarRoomDashboard, fetchWarRoomAlerts, resolveWarRoomAlert } from '../../lib/war-room';
import { Screen, Card, ScreenHeader } from '../../components/ui';
import { colors } from '../../lib/theme';

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
      <View className="mt-4 flex-row flex-wrap gap-2">
        <Card className="w-[47%]"><Text className="text-xs text-slate-500">Alerts</Text><Text className="text-xl font-bold text-navy">{data?.openAlerts ?? 0}</Text></Card>
        <Card className="w-[47%]"><Text className="text-xs text-slate-500">Escalations</Text><Text className="text-xl font-bold text-navy">{data?.openEscalations ?? 0}</Text></Card>
      </View>
      <Pressable onPress={() => router.push('/war-room/alerts')} className="mt-3 rounded-xl border px-4 py-3">
        <Text className="text-center font-medium" style={{ color: colors.navy }}>View All Alerts</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/war-room/escalations')} className="mt-2 rounded-xl border px-4 py-3">
        <Text className="text-center font-medium" style={{ color: colors.navy }}>View Escalations</Text>
      </Pressable>
      <ScrollView className="mt-4">
        {(alerts?.data ?? []).map((a: { id: string; title: string; severity: string }) => (
          <Card key={a.id} className="mb-2">
            <Text className="font-semibold">{a.title}</Text>
            <Text className="text-xs text-slate-500">{a.severity}</Text>
            <Pressable onPress={() => resolve.mutate(a.id)} className="mt-2 rounded bg-gold px-3 py-1 self-start">
              <Text style={{ color: colors.navy, fontSize: 12 }}>Resolve</Text>
            </Pressable>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
