import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { searchDonors } from '../../lib/fundraising';
import { Screen, ScreenHeader, Card, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

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
      <TextInput
        className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base"
        placeholder="Search donor name or mobile…"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#94a3b8"
      />
      <PrimaryButton label="Quick donation" onPress={() => router.push('/fundraising/donation-new')} />
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        {debounced.length < 2 ? (
          <Text className="text-center text-sm text-slate-500">Type at least 2 characters to search</Text>
        ) : isLoading ? (
          <Text className="text-center text-sm text-slate-500">Searching…</Text>
        ) : (data?.data ?? []).map((d) => (
          <Pressable
            key={d.id}
            onPress={() => router.push({ pathname: '/fundraising/donation-new', params: { donorId: d.id, donorName: d.name } })}
            className="mb-2"
          >
            <Card>
              <Text className="font-semibold" style={{ color: colors.navy }}>{d.name}</Text>
              <Text className="text-sm text-slate-500">{d.mobile ?? 'No mobile'} · {d._count.donations} donations</Text>
            </Card>
          </Pressable>
        ))}
        {debounced.length >= 2 && !isLoading && !data?.data?.length && (
          <View className="mt-2 items-center">
            <Text className="text-sm text-slate-500">No donors found</Text>
            <Pressable onPress={() => router.push('/fundraising/donation-new')} className="mt-2">
              <Text className="font-medium" style={{ color: colors.gold }}>Create new donor & donate</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
