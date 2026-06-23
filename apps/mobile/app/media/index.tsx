import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchMediaDashboard } from '../../lib/media';
import { Screen, Card, Badge, ScreenHeader } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function MediaIndex() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-media-dash'], queryFn: fetchMediaDashboard });

  return (
    <Screen>
      <ScreenHeader title="Media" subtitle="Reputation & opposition tracking" onBack={() => router.back()} />
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-2">
          {[
            { label: 'Pending attacks', value: data?.pendingAttacks ?? 0 },
            { label: 'Draft responses', value: data?.draftResponses ?? 0 },
            { label: 'Reputation', value: data?.reputationScore ?? 0 },
            { label: 'News', value: data?.totalNews ?? 0 },
          ].map((k) => (
            <Card key={k.label} className="w-[47%]">
              <Text className="text-xs text-slate-500">{k.label}</Text>
              <Text className="text-2xl font-bold" style={{ color: colors.navy }}>{k.value}</Text>
            </Card>
          ))}
        </View>
        <Pressable onPress={() => router.push('/media/response')} className="mt-4 rounded-xl bg-gold px-4 py-3">
          <Text className="text-center font-semibold" style={{ color: colors.navy }}>Submit Response</Text>
        </Pressable>
        <Text className="mb-2 mt-4 text-sm font-semibold text-navy">Recent Attacks</Text>
        {(data?.recentAttacks ?? []).map((a) => (
          <Card key={a.id} className="mb-2">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 font-medium text-navy" numberOfLines={2}>{a.title}</Text>
              <Badge label={a.responseStatus} color={colors.navy} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
