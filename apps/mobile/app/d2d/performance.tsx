import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, Card, KpiTile } from '../../components/ui';
import { fetchMyD2DAssignments } from '../../lib/d2d';
import { getTodayCompletedCount } from '../../lib/db';
import { colors } from '../../lib/theme';

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

        <View className="flex-row gap-3">
          <KpiTile label="Daily Target" value={target} icon="flag" accent={colors.info} />
          <KpiTile label="Completed Today" value={completed} icon="checkmark-done" accent={colors.success} />
        </View>

        <Card>
          <Text className="text-xs font-medium text-muted">Completion %</Text>
          <Text className="text-3xl font-extrabold text-ink">{pct}%</Text>
          <View className="mt-3 h-3 overflow-hidden rounded-full bg-canvas">
            <View className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </View>
        </Card>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
