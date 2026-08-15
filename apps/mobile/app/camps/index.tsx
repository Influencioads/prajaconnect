import { View, FlatList, RefreshControl, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchUpcomingCamps } from '../../lib/camps';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

function formatDate(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Camps() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-camps'],
    queryFn: fetchUpcomingCamps,
  });

  return (
    <Screen>
      <ScreenHeader title="Service Camps" subtitle="Upcoming camps & camp-day console" onBack={() => router.back()} />

      <Pressable
        onPress={() => router.push('/camps/worklist')}
        className="mb-3 flex-row items-center rounded-2xl border border-line bg-white p-3.5 active:opacity-80"
      >
        <Ionicons name="list" size={20} color={colors.violet} />
        <Text className="ml-2.5 flex-1 text-[15px] font-bold text-ink">My scheme worklist</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.faint} />
      </Pressable>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No upcoming camps" subtitle="Planned service camps will show up here." icon="bonfire-outline" />}
          ListFooterComponent={<View className="h-6" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${formatDate(item.date)} · ${item.village?.name ?? item.mandal?.name ?? '—'} · ${item._count.registrations} registered`}
              icon="bonfire"
              tint={colors.goldDark}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/camps/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
