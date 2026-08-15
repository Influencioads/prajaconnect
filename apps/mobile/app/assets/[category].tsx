import * as React from 'react';
import { FlatList, RefreshControl, View, ActivityIndicator } from 'react-native';
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
  PrimaryButton,
  type IconName,
} from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { fetchAssets, configForSlug, type AssetListItem } from '../../lib/assets';
import { colors } from '../../lib/theme';

const CATEGORY_META: Record<string, { icon: IconName; tint: string }> = {
  roads: { icon: 'trail-sign', tint: colors.navy },
  taxes: { icon: 'cash', tint: colors.success },
  'religious-places': { icon: 'star', tint: colors.violet },
  'total-works': { icon: 'construct', tint: colors.info },
  'dealer-shops': { icon: 'pricetag', tint: colors.teal },
  'burial-grounds': { icon: 'flag', tint: colors.muted },
  hospitals: { icon: 'medkit', tint: colors.danger },
  schools: { icon: 'school', tint: colors.info },
  'mepma-dwcra': { icon: 'people', tint: colors.violet },
  tanks: { icon: 'water', tint: colors.teal },
  rws: { icon: 'water', tint: colors.info },
  'green-ambassadors': { icon: 'leaf', tint: colors.success },
  'government-offices': { icon: 'business', tint: colors.navy },
};

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

  const meta = CATEGORY_META[config.slug] ?? { icon: 'business' as IconName, tint: colors.navy };

  return (
    <Screen>
      <ScreenHeader
        title={config.label}
        subtitle={`${total} records`}
        onBack={() => router.back()}
        right={
          canEdit ? (
            <PrimaryButton small label="New" icon="add" onPress={() => router.push(`/asset/form?category=${config.slug}`)} />
          ) : undefined
        }
      />
      <SearchBar value={search} onChangeText={setSearch} placeholder={`Search ${config.label.toLowerCase()}…`} />

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.navy} />}
          ListEmptyComponent={
            <EmptyState title="No assets found" subtitle="Pull to refresh or add a new record." icon={meta.icon} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : <View className="h-6" />
          }
          renderItem={({ item }: { item: AssetListItem }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.code} · ${config.primaryInfo?.(item) ?? ''}${item.mandal ? ' · ' + item.mandal.name : ''}`}
              icon={meta.icon}
              tint={meta.tint}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/asset/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
