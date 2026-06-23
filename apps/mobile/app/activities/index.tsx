import * as React from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchActivities, fetchActivityStats } from '../../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState, ErrorState, SearchBar, KpiTile } from '../../components/ui';
import { colors } from '../../lib/theme';

const TYPE_FILTERS: { label: string; value?: string }[] = [
  { label: 'All' },
  { label: 'Calls', value: 'Call' },
  { label: 'Tasks', value: 'Task' },
  { label: 'Meetings', value: 'Meeting' },
  { label: 'Field', value: 'FieldVisit' },
  { label: 'Follow-ups', value: 'GrievanceFollowup' },
];

function when(item: { scheduledAt?: string | null; dueAt?: string | null; createdAt: string }) {
  const d = new Date(item.scheduledAt ?? item.dueAt ?? item.createdAt);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Activities() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState<string | undefined>(undefined);

  const { data: stats } = useQuery({ queryKey: ['m-activity-stats'], queryFn: () => fetchActivityStats() });
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['m-activities', { search, type }],
      queryFn: ({ pageParam }) => fetchActivities({ page: pageParam, search: search || undefined, type }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    });
  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Screen>
      <ScreenHeader title="Activities" subtitle="Calls, tasks, meetings & field work" onBack={() => router.back()} />

      <View className="mb-3 flex-row gap-2">
        <KpiTile label="Today" value={stats?.today ?? 0} accent={colors.navy} />
        <KpiTile label="Overdue" value={stats?.overdue ?? 0} accent={colors.danger} />
        <KpiTile label="Done" value={stats?.completed ?? 0} accent={colors.success} />
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search activities…" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 max-h-10 flex-grow-0">
        <View className="flex-row gap-2">
          {TYPE_FILTERS.map((f) => {
            const active = type === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setType(f.value)}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}
              >
                <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState title="Couldn’t load activities" onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No activities found" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : null}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${item.type} · ${when(item)}${item.contactName ? ` · ${item.contactName}` : ''}`}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/activities/${item.id}`)}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => router.push('/activities/new')}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-navy shadow-lg active:opacity-90"
      >
        <Text className="text-3xl text-white" style={{ marginTop: -2 }}>+</Text>
      </Pressable>
    </Screen>
  );
}
