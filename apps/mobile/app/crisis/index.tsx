import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchCrisisDashboard } from '../../lib/crisis';
import { Screen, Card, Badge, ScreenHeader } from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

export default function CrisisIndex() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-crisis-dash'], queryFn: fetchCrisisDashboard });

  return (
    <Screen>
      <ScreenHeader title="Crisis" subtitle="Emergency issue monitoring" onBack={() => router.back()} />
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-2">
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Open</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.navy }}>{data?.openIssues ?? 0}</Text>
          </Card>
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Active</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.navy }}>{data?.activeIssues ?? 0}</Text>
          </Card>
        </View>
        <Text className="mb-2 mt-4 text-sm font-semibold text-navy">Open Issues</Text>
        {(data?.recentIssues ?? []).filter((i) => i.status === 'Open' || i.status === 'Active').map((issue) => (
          <Pressable
            key={issue.id}
            onPress={() => router.push({ pathname: '/crisis/acknowledge', params: { id: issue.id } })}
            className="mb-2"
          >
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-medium text-navy" numberOfLines={2}>{issue.title}</Text>
                <Badge label={issue.severity} color={statusColor[issue.severity] ?? colors.navy} />
              </View>
              <Text className="mt-1 text-xs text-slate-500">{issue.status}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
