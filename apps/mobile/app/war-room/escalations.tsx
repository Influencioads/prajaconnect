import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWarRoomEscalations } from '../../lib/war-room';
import { Screen, ScreenHeader, ListRow, StatusPill, EmptyState } from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

export default function WarRoomEscalationsMobile() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['m-war-esc'],
    queryFn: () => fetchWarRoomEscalations({ page: 1, limit: 30 }),
  });

  return (
    <Screen>
      <ScreenHeader title="Escalations" subtitle="Issues raised for higher review" onBack={() => router.back()} />
      <ScrollView className="mt-4">
        {(data?.data ?? []).map((e: { id: string; title: string; status: string; priority: string }) => (
          <ListRow
            key={e.id}
            title={e.title}
            subtitle={`Priority: ${e.priority}`}
            icon="arrow-up-circle"
            tint={statusColor[e.priority] ?? colors.danger}
            right={<StatusPill status={e.status} />}
          />
        ))}
        {!data?.data?.length ? (
          <EmptyState icon="trail-sign" title="No escalations" subtitle="Nothing has been escalated yet." />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
