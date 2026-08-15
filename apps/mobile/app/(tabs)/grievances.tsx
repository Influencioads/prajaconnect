import * as React from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchGrievances } from '../../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, SearchBar, Loading, EmptyState, ErrorState, Chip, PrimaryButton } from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

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
      <ScreenHeader
        title="Grievances"
        subtitle="Citizen complaints & resolution"
        right={<PrimaryButton label="New" icon="add" small onPress={() => router.push('/grievance/new')} />}
      />

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search grievances…" />

      <View className="mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={s}
              active={status === s}
              color={s === 'All' ? colors.navy : statusColor[s] ?? colors.navy}
              onPress={() => setStatus(s)}
            />
          ))}
        </ScrollView>
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.navy]} />}
          ListEmptyComponent={<EmptyState title="No grievances found" subtitle="Try a different search or filter." icon="megaphone-outline" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : <View className="h-6" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${item.code}${item.mandal ? ` · ${item.mandal.name}` : ''} · ${item.priority}`}
              icon="megaphone"
              tint={statusColor[item.status] ?? colors.navy}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/grievance/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
