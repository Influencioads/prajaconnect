import * as React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  Screen,
  ScreenHeader,
  SearchBar,
  ListRow,
  StatusPill,
  Loading,
  EmptyState,
  KpiTile,
  Chip,
  PrimaryButton,
} from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { fetchNetworkList, fetchNetworkStats, NETWORK_VIEWS } from '../lib/network';

const STATUSES = ['All', 'Active', 'Inactive'];

export function NetworkListView({ viewKey }: { viewKey: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const view = NETWORK_VIEWS[viewKey];
  const canEdit = hasEdit(user?.permissions);

  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState('All');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters = {
    search: debounced || undefined,
    status: status === 'All' ? undefined : status,
    category: view?.category,
  };

  const { data: stats } = useQuery({
    queryKey: ['m-network-stats', viewKey],
    queryFn: () => fetchNetworkStats(view.resource, { category: view?.category }),
    enabled: !!view,
  });
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['m-network', viewKey, filters],
    queryFn: ({ pageParam }) => fetchNetworkList(view.resource, { ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: !!view,
  });
  const items = data?.pages.flatMap((p) => p.data) ?? [];

  if (!view) {
    return (
      <Screen>
        <ScreenHeader title="Not found" onBack={() => router.back()} />
        <EmptyState title="Unknown section" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={view.title} subtitle={view.subtitle} onBack={() => router.back()} />

      <View className="mb-3 flex-row gap-3">
        <KpiTile label="Total" value={stats?.total ?? 0} accent={colors.navy} icon="people" />
        <KpiTile label="Active" value={stats?.active ?? 0} accent={colors.success} icon="checkmark-circle" />
        <KpiTile label="Inactive" value={stats?.inactive ?? 0} accent={colors.danger} icon="pause-circle" />
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, mobile, email…" />

      <View className="mb-3 flex-row gap-2">
        {STATUSES.map((s) => (
          <Chip key={s} label={s} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </View>

      {canEdit ? (
        <PrimaryButton
          label="Add member"
          icon="person-add"
          small
          className="mb-3"
          onPress={() => router.push(`/committees/form?view=${viewKey}`)}
        />
      ) : null}

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No records found" subtitle="Adjust filters or add a new member." />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : <View className="h-10" />
          }
          renderItem={({ item: r }) => (
            <ListRow
              avatar
              title={r.fullName}
              subtitle={`${r.mobile}${r.mandal?.name ? ` · ${r.mandal.name}` : ''}`}
              right={<StatusPill status={r.status} />}
              onPress={() => router.push(`/committees/${r.id}?view=${viewKey}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function hasEdit(permissions?: { module: string; accessLevel: string }[]) {
  const perm = permissions?.find((p) => p.module === 'committees');
  return !!perm && ['edit', 'full'].includes(perm.accessLevel);
}

export function canFullDelete(permissions?: { module: string; accessLevel: string }[]) {
  const perm = permissions?.find((p) => p.module === 'committees');
  return perm?.accessLevel === 'full';
}

export function canEditNetwork(permissions?: { module: string; accessLevel: string }[]) {
  const perm = permissions?.find((p) => p.module === 'committees');
  return !!perm && ['edit', 'full'].includes(perm.accessLevel);
}
