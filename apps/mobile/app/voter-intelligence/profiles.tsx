import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterProfiles, updateVoterProfile } from '../../lib/voter-intelligence';
import { Screen, Card, ScreenHeader, SearchBar, Chip, Avatar, EmptyState } from '../../components/ui';

const PREFS = ['Supporter', 'Neutral', 'Opponent', 'Swing'];

export default function VoterProfilesMobile() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['m-voter-profiles', search],
    queryFn: () => fetchVoterProfiles({ page: 1, limit: 30, search }),
  });

  const tag = useMutation({
    mutationFn: ({ id, preference }: { id: string; preference: string }) =>
      updateVoterProfile(id, { preference, isSwing: preference === 'Swing' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m-voter-profiles'] }),
  });

  return (
    <Screen>
      <ScreenHeader title="Quick Tag" subtitle="Search and set voter preference" onBack={() => router.back()} />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search name or voter ID" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {(data?.data ?? []).map((p: { id: string; preference: string; citizen: { name: string; voterId?: string } }) => (
          <Card key={p.id} className="mb-2.5">
            <View className="flex-row items-center">
              <View className="mr-3">
                <Avatar name={p.citizen.name} size={42} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
                  {p.citizen.name}
                </Text>
                <Text className="mt-0.5 text-xs text-muted">
                  {p.citizen.voterId ?? 'No ID'} · {p.preference}
                </Text>
              </View>
            </View>
            <View className="mt-3 flex-row flex-wrap gap-1.5">
              {PREFS.map((pref) => (
                <Chip
                  key={pref}
                  label={pref}
                  active={p.preference === pref}
                  onPress={() => tag.mutate({ id: p.id, preference: pref })}
                />
              ))}
            </View>
          </Card>
        ))}
        {!data?.data?.length ? (
          <EmptyState title="No voters found" subtitle="Try a different name or voter ID." icon="search" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
