import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVoterDashboard } from '../../lib/voter-intelligence';
import { Screen, Card, Badge, ScreenHeader } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function VoterIntelligenceScreen() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-voter-dash'], queryFn: fetchVoterDashboard });

  return (
    <Screen>
      <ScreenHeader title="Voter Intelligence" subtitle="Field compact dashboard" onBack={() => router.back()} />
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-2">
          {[
            { label: 'Profiles', value: data?.totalProfiles ?? 0 },
            { label: 'Supporters', value: data?.supporters ?? 0 },
            { label: 'Swing', value: data?.swings ?? 0 },
            { label: 'Key', value: data?.keyVoters ?? 0 },
          ].map((k) => (
            <Card key={k.label} className="w-[47%]">
              <Text className="text-xs text-slate-500">{k.label}</Text>
              <Text className="text-2xl font-bold" style={{ color: colors.navy }}>{k.value}</Text>
            </Card>
          ))}
        </View>
        <Pressable onPress={() => router.push('/voter-intelligence/profiles')} className="mt-4 rounded-xl bg-gold px-4 py-3">
          <Text className="text-center font-semibold" style={{ color: colors.navy }}>Tag Voters</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/voter-intelligence/booths')} className="mt-2 rounded-xl border border-slate-200 px-4 py-3">
          <Text className="text-center font-medium" style={{ color: colors.navy }}>Booth Strength</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/voter-intelligence/duplicates')} className="mt-2 rounded-xl border border-slate-200 px-4 py-3">
          <Text className="text-center font-medium" style={{ color: colors.navy }}>Duplicate Review</Text>
        </Pressable>
        {(data?.topPriorityBooths ?? []).slice(0, 5).map((b: { id: string; priorityBoothScore: number; strengthLabel: string; booth: { number: string } }) => (
          <Card key={b.id} className="mt-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium">Booth {b.booth.number}</Text>
              <Badge label={b.strengthLabel} color={colors.navy} />
            </View>
            <Text className="text-sm text-slate-500">Priority {b.priorityBoothScore}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
