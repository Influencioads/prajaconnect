import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchOfflineSyncDashboard } from '../../lib/offline-sync';
import { flushSyncQueue, getSyncStatus } from '../../lib/sync';
import { getPendingSyncCount } from '../../lib/db';
import { Screen, Card, ScreenHeader, PrimaryButton, KpiTile } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function OfflineSyncMobile() {
  const router = useRouter();
  const qc = useQueryClient();
  const [localPending, setLocalPending] = React.useState(0);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [lastResult, setLastResult] = React.useState<string | null>(null);

  const { data: server } = useQuery({
    queryKey: ['m-offline-sync'],
    queryFn: fetchOfflineSyncDashboard,
  });

  const { data: status } = useQuery({
    queryKey: ['m-sync-status'],
    queryFn: getSyncStatus,
    refetchInterval: 15000,
  });

  React.useEffect(() => {
    getPendingSyncCount().then(setLocalPending).catch(() => undefined);
  }, [lastResult]);

  const manualSync = useMutation({
    mutationFn: flushSyncQueue,
    onSuccess: (result) => {
      setSyncError(result.errors.length ? result.errors.join('; ') : null);
      setLastResult(`Synced ${result.synced}, failed ${result.failed}, conflicts ${result.conflicts}`);
      getPendingSyncCount().then(setLocalPending).catch(() => undefined);
      qc.invalidateQueries({ queryKey: ['m-offline-sync'] });
      qc.invalidateQueries({ queryKey: ['m-sync-status'] });
    },
    onError: (e: Error) => setSyncError(e.message),
  });

  const pending = localPending + (server?.pending ?? 0);

  return (
    <Screen>
      <ScreenHeader
        title="Sync Status"
        subtitle={`${status?.online ? 'Online' : 'Offline'} · ${pending} pending`}
        onBack={() => router.back()}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          <KpiTile label="Local pending" value={localPending} icon="time" accent={colors.warning} />
          <KpiTile label="Server pending" value={server?.pending ?? 0} icon="cloud-upload" accent={colors.info} />
        </View>
        <View className="flex-row gap-3">
          <KpiTile label="Failed" value={server?.failed ?? 0} icon="alert-circle" accent={colors.danger} />
          <KpiTile label="Conflicts" value={server?.conflicts ?? 0} icon="git-branch" accent={colors.danger} />
        </View>

        <Card className="mt-1">
          <Text className="text-sm text-muted">Synced (server): {server?.synced ?? 0}</Text>
          {lastResult ? (
            <Text className="mt-2 text-sm" style={{ color: colors.success }}>
              {lastResult}
            </Text>
          ) : null}
          {syncError ? (
            <Text className="mt-2 text-sm" style={{ color: colors.danger }}>
              {syncError}
            </Text>
          ) : null}
          <PrimaryButton
            label={manualSync.isPending ? 'Syncing…' : 'Sync now'}
            icon="sync"
            className="mt-3"
            onPress={() => manualSync.mutate()}
            loading={manualSync.isPending}
          />
        </Card>

        <PrimaryButton
          label={`View Conflicts (${server?.conflicts ?? 0})`}
          variant="outline"
          icon="git-branch"
          className="mt-3"
          onPress={() => router.push('/offline-sync/conflicts')}
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
