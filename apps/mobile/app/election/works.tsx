import { FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchMyWorks } from '../../lib/elections';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState } from '../../components/ui';

function deadline(item: { deadline?: string | null }) {
  if (!item.deadline) return 'No deadline';
  const d = new Date(item.deadline);
  return `Due ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
}

export default function ElectionWorks() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-election-works'],
    queryFn: () => fetchMyWorks(),
  });

  return (
    <Screen>
      <ScreenHeader title="My Campaign Works" subtitle="Works assigned to you" onBack={() => router.back()} />
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No works assigned" subtitle="Check back later for campaign tasks." />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${item.type} · ${deadline(item)}${item.mandal?.name ? ` · ${item.mandal.name}` : ''}`}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push({ pathname: '/election/work-update', params: { id: item.id } })}
            />
          )}
        />
      )}
    </Screen>
  );
}
