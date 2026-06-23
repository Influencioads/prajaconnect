import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, TextInput, Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterProfiles, updateVoterProfile } from '../../lib/voter-intelligence';
import { Screen, Card, ScreenHeader } from '../../components/ui';
import { colors } from '../../lib/theme';

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
      <TextInput
        className="mt-3 rounded-lg border border-slate-200 px-3 py-2"
        placeholder="Search name or voter ID"
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
        {(data?.data ?? []).map((p: { id: string; preference: string; citizen: { name: string; voterId?: string } }) => (
          <Card key={p.id} className="mb-2">
            <Text className="font-semibold">{p.citizen.name}</Text>
            <Text className="text-xs text-slate-500">{p.citizen.voterId ?? 'No ID'} · {p.preference}</Text>
            <View className="mt-2 flex-row flex-wrap gap-1">
              {PREFS.map((pref) => (
                <Pressable
                  key={pref}
                  onPress={() => tag.mutate({ id: p.id, preference: pref })}
                  className="rounded px-2 py-1"
                  style={{ backgroundColor: p.preference === pref ? colors.gold : '#f1f5f9' }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.navy }}>{pref}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
