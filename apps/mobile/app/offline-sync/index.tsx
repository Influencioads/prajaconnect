import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchOfflineSyncDashboard } from '../../lib/offline-sync';
import { flushSyncQueue, getSyncStatus } from '../../lib/sync';
import { getPendingSyncCount } from '../../lib/db';
import { Screen, Card, ScreenHeader, PrimaryButton } from '../../components/ui';
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
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-2">
          {[
            { label: 'Local pending', value: localPending },
            { label: 'Server pending', value: server?.pending ?? 0 },
            { label: 'Failed', value: server?.failed ?? 0 },
            { label: 'Conflicts', value: server?.conflicts ?? 0 },
          ].map((k) => (
            <Card key={k.label} className="w-[47%]">
              <Text className="text-xs text-slate-500">{k.label}</Text>
              <Text className="text-xl font-bold text-navy">{k.value}</Text>
            </Card>
          ))}
        </View>

        <Card className="mt-4">
          <Text className="text-sm text-gray-600">Synced (server): {server?.synced ?? 0}</Text>
          {lastResult ? <Text className="mt-2 text-sm text-green-700">{lastResult}</Text> : null}
          {syncError ? <Text className="mt-2 text-sm text-red-600">{syncError}</Text> : null}
          <PrimaryButton
            label={manualSync.isPending ? 'Syncing…' : 'Sync now'}
            onPress={() => manualSync.mutate()}
            loading={manualSync.isPending}
          />
        </Card>

        <Pressable onPress={() => router.push('/offline-sync/conflicts')} className="mt-3 rounded-xl border px-4 py-3">
          <Text className="text-center font-medium" style={{ color: colors.navy }}>
            View Conflicts ({server?.conflicts ?? 0})
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
