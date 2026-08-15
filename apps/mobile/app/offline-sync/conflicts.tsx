import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchPendingConflicts, resolveSyncConflict } from '../../lib/offline-sync';
import { Screen, ScreenHeader, Card, Badge, PrimaryButton, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function OfflineSyncConflicts() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['m-offline-conflicts'],
    queryFn: () => fetchPendingConflicts({ page: 1, limit: 30 }),
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: 'server' | 'client' }) =>
      resolveSyncConflict(id, resolution),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m-offline-conflicts'] }),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Sync Conflicts" subtitle="Choose server or local version" onBack={() => router.back()} />

        {(data?.data ?? []).map((c) => (
          <Card key={c.id} className="mb-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Badge label={c.queue.entityType} color={colors.info} />
              <Text className="text-xs text-faint">{new Date(c.createdAt).toLocaleString()}</Text>
            </View>
            {c.queue.error ? (
              <Text className="mb-2 text-sm" style={{ color: colors.danger }}>
                {c.queue.error}
              </Text>
            ) : null}
            <Text className="text-sm text-muted" numberOfLines={3}>
              {JSON.stringify(c.queue.payload)}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <PrimaryButton
                label="Keep server"
                variant="outline"
                small
                icon="cloud-upload"
                className="flex-1"
                onPress={() => resolve.mutate({ id: c.id, resolution: 'server' })}
              />
              <PrimaryButton
                label="Use local"
                variant="gold"
                small
                icon="checkmark-circle"
                className="flex-1"
                onPress={() => resolve.mutate({ id: c.id, resolution: 'client' })}
              />
            </View>
          </Card>
        ))}
        {!data?.data?.length ? (
          <EmptyState
            title="No unresolved conflicts"
            subtitle="Everything is in sync with the server."
            icon="checkmark-done"
          />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
