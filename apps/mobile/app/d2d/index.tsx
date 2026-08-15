import * as React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, ScreenHeader, Card, PrimaryButton, Badge, MenuRow, KpiTile, SectionTitle, EmptyState } from '../../components/ui';
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
            <Text className="font-semibold text-ink">Sync Status</Text>
            <Badge label={sync.online ? 'Online' : 'Offline'} color={sync.online ? colors.success : colors.danger} dot />
          </View>
          <Text className="mt-2 text-sm text-muted">
            Pending sync: <Text className="font-bold text-ink">{sync.pending}</Text>
          </Text>
          <View className="mt-3 self-start">
            <PrimaryButton
              label="Sync now"
              icon="sync"
              variant="outline"
              small
              onPress={async () => { await flushSyncQueue(); await refreshSync(); }}
            />
          </View>
        </Card>

        <View className="flex-row gap-3">
          <KpiTile label="Daily Target" value={dailyTarget} icon="flag" accent={colors.info} />
          <KpiTile label="Completed Today" value={data?.completedToday ?? 0} icon="checkmark-done" accent={colors.success} />
        </View>

        <SectionTitle>Assigned Surveys</SectionTitle>
        {(data?.assignments ?? []).map((a) => (
          <Card key={a.id} className="mb-3">
            <Text className="font-bold text-ink">{a.survey.name}</Text>
            {a.survey.nameTe ? <Text className="text-sm text-muted">{a.survey.nameTe}</Text> : null}
            <Text className="mt-1 text-xs text-faint">
              {a.survey.targetMandal?.name} · {a.survey.targetVillage?.name} · Booth {a.survey.targetBooth?.number}
            </Text>
            <View className="mt-3">
              <PrimaryButton
                label="Start Survey"
                icon="walk"
                onPress={() => router.push({ pathname: '/d2d/start', params: { surveyId: a.survey.id, surveyName: a.survey.name } })}
              />
            </View>
          </Card>
        ))}

        {!isLoading && !data?.assignments?.length && (
          <EmptyState title="No surveys assigned yet" subtitle="Pull to refresh when your team lead assigns one." icon="clipboard-outline" />
        )}

        <View className="mt-4 gap-2">
          <MenuRow
            label="Volunteer Performance"
            description="Daily and weekly completion stats"
            icon="stats-chart"
            tint={colors.info}
            onPress={() => router.push('/d2d/performance')}
          />
        </View>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
