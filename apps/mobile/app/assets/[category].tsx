import * as React from 'react';
import { FlatList, RefreshControl, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Screen,
  ScreenHeader,
  SearchBar,
  StatusPill,
  ListRow,
  Loading,
  EmptyState,
} from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { fetchAssets, configForSlug, type AssetListItem } from '../../lib/assets';
import { colors } from '../../lib/theme';

export default function AssetCategoryList() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const config = configForSlug(category);
  const level = user?.permissions?.find((p) => p.module === 'assets')?.accessLevel;
  const canEdit = level === 'edit' || level === 'full';

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['m-assets', config.slug, debounced],
      queryFn: ({ pageParam }) =>
        fetchAssets({ page: pageParam, category: config.category, search: debounced || undefined }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    });
  const items = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.meta?.total ?? 0;

  return (
    <Screen>
      <ScreenHeader title={config.label} subtitle={`${total} records`} onBack={() => router.back()} />
      <SearchBar value={search} onChangeText={setSearch} placeholder={`Search ${config.label.toLowerCase()}…`} />

      {canEdit && (
        <Pressable
          onPress={() => router.push(`/asset/form?category=${config.slug}`)}
          className="mb-3 h-11 items-center justify-center rounded-xl bg-navy active:opacity-90"
        >
          <Text className="font-bold text-white">+ New {config.singular}</Text>
        </Pressable>
      )}

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.navy} />}
          ListEmptyComponent={<EmptyState title="No assets found" subtitle="Pull to refresh or add a new record." />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : null}
          renderItem={({ item }: { item: AssetListItem }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.code} · ${config.primaryInfo?.(item) ?? ''}${item.mandal ? ' · ' + item.mandal.name : ''}`}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/asset/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
