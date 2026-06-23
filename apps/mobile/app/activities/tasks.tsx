import { FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchActivities } from '../../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState } from '../../components/ui';

function due(item: { dueAt?: string | null }) {
  if (!item.dueAt) return 'No due date';
  const d = new Date(item.dueAt);
  return `Due ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
}

export default function MyTasks() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-my-tasks'],
    queryFn: () => fetchActivities({ type: 'Task', scope: 'me' }),
  });

  return (
    <Screen>
      <ScreenHeader title="My Tasks" subtitle="Tasks assigned to you" onBack={() => router.back()} />
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No tasks assigned" subtitle="You're all caught up." />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${due(item)} · ${item.priority}`}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/activities/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
