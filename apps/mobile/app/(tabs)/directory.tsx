import * as React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchCadres, fetchCitizens } from '../../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, SearchBar, Loading, EmptyState, ErrorState, Badge } from '../../components/ui';
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
      <ScreenHeader title="Directory" />

      <View className="mb-3 flex-row rounded-xl bg-gray-200 p-1">
        {(['cadre', 'citizens'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className="flex-1 items-center rounded-lg py-2"
            style={{ backgroundColor: tab === t ? '#fff' : 'transparent' }}
          >
            <Text className="text-sm font-semibold capitalize" style={{ color: tab === t ? colors.navy : colors.muted }}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder={`Search ${tab}…`} />

      {tab === 'citizens' && (
        <Pressable
          onPress={() => router.push('/citizens/create')}
          className="mb-3 rounded-xl bg-gold px-4 py-3 active:opacity-80"
        >
          <Text className="text-center font-bold text-navy">Add citizen</Text>
        </Pressable>
      )}

      {active.isLoading ? (
        <Loading />
      ) : active.isError ? (
        <ErrorState title={`Couldn’t load ${tab}`} onRetry={active.refetch} />
      ) : tab === 'cadre' ? (
        <FlatList
          data={cadre.data?.data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={cadre.isRefetching} onRefresh={cadre.refetch} />}
          ListEmptyComponent={<EmptyState title="No cadre found" />}
          renderItem={({ item }) => (
            <ListRow
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
          refreshControl={<RefreshControl refreshing={citizens.isRefetching} onRefresh={citizens.refetch} />}
          ListEmptyComponent={<EmptyState title="No citizens found" />}
          renderItem={({ item }) => (
            <ListRow
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
