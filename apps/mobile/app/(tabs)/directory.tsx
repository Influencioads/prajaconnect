import * as React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchCadres, fetchCitizens } from '../../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, SearchBar, Loading, EmptyState, ErrorState, Badge, SegmentedTabs, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

type Tab = 'cadre' | 'citizens';

export default function Directory() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>('cadre');
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const cadre = useQuery({
    queryKey: ['m-cadre', debounced],
    queryFn: () => fetchCadres({ search: debounced || undefined }),
    enabled: tab === 'cadre',
  });
  const citizens = useQuery({
    queryKey: ['m-citizens', debounced],
    queryFn: () => fetchCitizens({ search: debounced || undefined }),
    enabled: tab === 'citizens',
  });

  const active = tab === 'cadre' ? cadre : citizens;

  return (
    <Screen>
      <ScreenHeader
        title="Directory"
        subtitle="Cadre & citizen records"
        right={
          tab === 'citizens' ? (
            <PrimaryButton label="Add" icon="person-add" variant="gold" small onPress={() => router.push('/citizens/create')} />
          ) : undefined
        }
      />

      <SegmentedTabs<Tab>
        tabs={[
          { key: 'cadre', label: 'Cadre' },
          { key: 'citizens', label: 'Citizens' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <SearchBar value={search} onChangeText={setSearch} placeholder={`Search ${tab}…`} />

      {active.isLoading ? (
        <Loading />
      ) : active.isError ? (
        <ErrorState title={`Couldn’t load ${tab}`} onRetry={active.refetch} />
      ) : tab === 'cadre' ? (
        <FlatList
          data={cadre.data?.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={cadre.isRefetching} onRefresh={cadre.refetch} colors={[colors.navy]} />}
          ListEmptyComponent={<EmptyState title="No cadre found" icon="people-outline" />}
          ListFooterComponent={<View className="h-6" />}
          renderItem={({ item }) => (
            <ListRow
              avatar
              title={item.name}
              subtitle={`${item.designation}${item.mandal ? ` · ${item.mandal.name}` : ''}`}
              right={<StatusPill status={item.status} />}
            />
          )}
        />
      ) : (
        <FlatList
          data={citizens.data?.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={citizens.isRefetching} onRefresh={citizens.refetch} colors={[colors.navy]} />}
          ListEmptyComponent={<EmptyState title="No citizens found" icon="people-outline" />}
          ListFooterComponent={<View className="h-6" />}
          renderItem={({ item }) => (
            <ListRow
              avatar
              title={item.name}
              subtitle={`${item.mobile ?? 'No mobile'}${item.village ? ` · ${item.village.name}` : ''}`}
              right={<Badge label={item.status} color={colors.navy} />}
              onPress={() => router.push(`/citizen/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
