import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchManifestoDashboard } from '../../lib/manifesto';
import { Screen, Card, Badge, ScreenHeader } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function ManifestoIndex() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-manifesto-dash'], queryFn: fetchManifestoDashboard });

  return (
    <Screen>
      <ScreenHeader title="Manifesto" subtitle="Election promise tracker" onBack={() => router.back()} />
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-2">
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Total promises</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.navy }}>{data?.totalPromises ?? 0}</Text>
          </Card>
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Avg completion</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.navy }}>{Math.round(data?.avgCompletionPct ?? 0)}%</Text>
          </Card>
        </View>
        <Pressable onPress={() => router.push('/manifesto/update')} className="mt-4 rounded-xl bg-gold px-4 py-3">
          <Text className="text-center font-semibold" style={{ color: colors.navy }}>Post Field Update</Text>
        </Pressable>
        <Text className="mb-2 mt-4 text-sm font-semibold text-navy">Recent Promises</Text>
        {(data?.recentPromises ?? []).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push({ pathname: '/manifesto/update', params: { promiseId: p.id } })}
            className="mb-2"
          >
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-medium text-navy" numberOfLines={2}>{p.title}</Text>
                <Badge label={p.workStatus} color={colors.navy} />
              </View>
              <Text className="mt-1 text-sm text-slate-500">{p.completionPct}% · {p.department ?? 'General'}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
