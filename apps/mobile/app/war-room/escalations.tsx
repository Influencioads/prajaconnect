import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWarRoomEscalations } from '../../lib/war-room';
import { Screen, Card, ScreenHeader } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function WarRoomEscalationsMobile() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['m-war-esc'],
    queryFn: () => fetchWarRoomEscalations({ page: 1, limit: 30 }),
  });

  return (
    <Screen>
      <ScreenHeader title="Escalations" onBack={() => router.back()} />
      <ScrollView className="mt-4">
        {(data?.data ?? []).map((e: { id: string; title: string; status: string; priority: string }) => (
          <Card key={e.id} className="mb-2">
            <Text className="font-semibold" style={{ color: colors.navy }}>{e.title}</Text>
            <Text className="text-sm text-slate-500">{e.status} · {e.priority}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
