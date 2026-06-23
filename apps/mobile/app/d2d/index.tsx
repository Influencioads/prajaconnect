import * as React from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, Card, PrimaryButton, Badge, MenuRow } from '../../components/ui';
import { fetchMyD2DAssignments } from '../../lib/d2d';
import { getSyncStatus, flushSyncQueue, startSyncListener } from '../../lib/sync';
import { cacheSurveys } from '../../lib/db';
import { colors } from '../../lib/theme';

export default function D2DHome() {
  const router = useRouter();
  const [sync, setSync] = React.useState({ pending: 0, online: true });

  const refreshSync = React.useCallback(async () => {
    setSync(await getSyncStatus());
  }, []);

  React.useEffect(() => {
    refreshSync();
    return startSyncListener((pending) => setSync((s) => ({ ...s, pending })));
  }, [refreshSync]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-d2d-assignments'],
    queryFn: async () => {
      const result = await fetchMyD2DAssignments();
      await cacheSurveys(
        result.assignments.map((a) => ({
          id: a.survey.id,
          name: a.survey.name,
          nameTe: a.survey.nameTe ?? undefined,
          type: a.survey.type,
          payload: a.survey,
        })),
      );
      return result;
    },
  });

  const dailyTarget = data?.targets?.[0]?.target ?? data?.assignments?.[0]?.dailyTarget ?? 0;

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="D2D Survey" subtitle="Door-to-door field surveys" onBack={() => router.back()} />

        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-navy">Sync Status</Text>
            <Badge label={sync.online ? 'Online' : 'Offline'} color={sync.online ? '#22c55e' : '#ef4444'} />
          </View>
          <Text className="mt-2 text-sm text-gray-600">
            Pending sync: <Text className="font-bold text-navy">{sync.pending}</Text>
          </Text>
          <Pressable onPress={async () => { await flushSyncQueue(); await refreshSync(); }} className="mt-3">
            <Text className="text-sm font-semibold text-navy">Tap to sync now</Text>
          </Pressable>
        </Card>

        <View className="mb-4 flex-row gap-3">
          <Card className="flex-1">
            <Text className="text-xs text-gray-500">Daily Target</Text>
            <Text className="text-2xl font-bold text-navy">{dailyTarget}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-gray-500">Completed Today</Text>
            <Text className="text-2xl font-bold text-navy">{data?.completedToday ?? 0}</Text>
          </Card>
        </View>

        <Text className="mb-2 text-base font-bold text-navy">Assigned Surveys</Text>
        {(data?.assignments ?? []).map((a) => (
          <Card key={a.id} className="mb-3">
            <Text className="font-bold text-navy">{a.survey.name}</Text>
            {a.survey.nameTe ? <Text className="text-sm text-gray-500">{a.survey.nameTe}</Text> : null}
            <Text className="mt-1 text-xs text-gray-500">
              {a.survey.targetMandal?.name} · {a.survey.targetVillage?.name} · Booth {a.survey.targetBooth?.number}
            </Text>
            <View className="mt-3">
              <PrimaryButton
                label="Start Survey"
                onPress={() => router.push({ pathname: '/d2d/start', params: { surveyId: a.survey.id, surveyName: a.survey.name } })}
              />
            </View>
          </Card>
        ))}

        {!isLoading && !data?.assignments?.length && (
          <Card><Text className="text-center text-gray-500">No surveys assigned yet.</Text></Card>
        )}

        <View className="mt-4 gap-2">
          <MenuRow label="Volunteer Performance" description="Daily and weekly completion stats" onPress={() => router.push('/d2d/performance')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
