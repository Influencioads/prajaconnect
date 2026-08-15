import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { searchDonors } from '../../lib/fundraising';
import { Screen, ScreenHeader, SearchBar, PrimaryButton, ListRow, EmptyState, Loading } from '../../components/ui';

export default function FundraisingScreen() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['m-fundraising-donors', debounced],
    queryFn: () => searchDonors(debounced),
    enabled: debounced.length >= 2,
  });

  return (
    <Screen>
      <ScreenHeader title="Fundraising" subtitle="Search donors & capture donations" onBack={() => router.back()} />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search donor name or mobile…" />
      <PrimaryButton label="Quick donation" icon="cash" onPress={() => router.push('/fundraising/donation-new')} />
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        {debounced.length < 2 ? (
          <EmptyState title="Find a donor" subtitle="Type at least 2 characters to search by name or mobile." icon="search" />
        ) : isLoading ? (
          <Loading label="Searching…" />
        ) : (data?.data ?? []).map((d) => (
          <ListRow
            key={d.id}
            avatar
            title={d.name}
            subtitle={`${d.mobile ?? 'No mobile'} · ${d._count.donations} donations`}
            onPress={() => router.push({ pathname: '/fundraising/donation-new', params: { donorId: d.id, donorName: d.name } })}
          />
        ))}
        {debounced.length >= 2 && !isLoading && !data?.data?.length && (
          <View className="items-center">
            <EmptyState title="No donors found" subtitle="Create a new donor and record their donation." icon="person-add" />
            <PrimaryButton
              small
              variant="gold"
              icon="person-add"
              label="Create new donor & donate"
              onPress={() => router.push('/fundraising/donation-new')}
            />
          </View>
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
