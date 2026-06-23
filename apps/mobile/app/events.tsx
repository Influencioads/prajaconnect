import { FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState } from '../components/ui';

function formatDateTime(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Events() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-events'],
    queryFn: () => fetchEvents({}),
  });

  return (
    <Screen>
      <ScreenHeader title="Events" subtitle="Rallies, camps & meetings" onBack={() => router.back()} />
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No events scheduled" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${formatDateTime(item.startAt)}${item.venue ? ` · ${item.venue}` : ''} · ${item._count.attendees} checked in`}
              right={<StatusPill status={item.status} />}
            />
          )}
        />
      )}
    </Screen>
  );
}
