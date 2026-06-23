import * as React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchGrievances } from '../../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, SearchBar, Loading, EmptyState, ErrorState } from '../../components/ui';
import { colors } from '../../lib/theme';

const STATUSES = ['All', 'Open', 'Assigned', 'InProgress', 'Escalated', 'Resolved', 'Closed'];

export default function Grievances() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState('All');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['m-grievances', debounced, status],
      queryFn: ({ pageParam }) =>
        fetchGrievances({ page: pageParam, search: debounced || undefined, status: status === 'All' ? undefined : status }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    });
  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <ScreenHeader title="Grievances" />
        <Pressable
          onPress={() => router.push('/grievance/new')}
          className="rounded-xl bg-navy px-4 py-2 active:opacity-90"
        >
          <Text className="font-bold text-white">+ New</Text>
        </Pressable>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search grievances…" />

      <View className="mb-2 flex-row flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: status === s ? colors.navy : '#E2E8F0' }}
          >
            <Text className="text-xs font-semibold" style={{ color: status === s ? '#fff' : colors.muted }}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState title="Couldn’t load grievances" onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No grievances found" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : null}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${item.code}${item.mandal ? ` · ${item.mandal.name}` : ''} · ${item.priority}`}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/grievance/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
