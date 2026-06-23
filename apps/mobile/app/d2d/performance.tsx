import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, Card } from '../../components/ui';
import { fetchMyD2DAssignments } from '../../lib/d2d';
import { getTodayCompletedCount } from '../../lib/db';

export default function D2DPerformance() {
  const router = useRouter();
  const [localToday, setLocalToday] = React.useState(0);

  const { data } = useQuery({ queryKey: ['m-d2d-assignments'], queryFn: fetchMyD2DAssignments });

  React.useEffect(() => {
    getTodayCompletedCount().then(setLocalToday);
  }, []);

  const target = data?.targets?.[0]?.target ?? data?.assignments?.[0]?.dailyTarget ?? 0;
  const completed = (data?.completedToday ?? 0) + localToday;
  const pct = target ? Math.min(100, Math.round((completed / target) * 100)) : 0;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Volunteer Performance" subtitle="Your field survey stats" onBack={() => router.back()} />

        <Card className="mb-4">
          <Text className="text-xs text-gray-500">Daily Target</Text>
          <Text className="text-3xl font-bold text-navy">{target}</Text>
        </Card>

        <Card className="mb-4">
          <Text className="text-xs text-gray-500">Completed Today</Text>
          <Text className="text-3xl font-bold text-navy">{completed}</Text>
        </Card>

        <Card>
          <Text className="text-xs text-gray-500">Completion %</Text>
          <Text className="text-3xl font-bold text-navy">{pct}%</Text>
          <View className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
            <View className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
