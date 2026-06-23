import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchPendingConflicts, resolveSyncConflict } from '../../lib/offline-sync';
import { Screen, ScreenHeader, Card, Badge } from '../../components/ui';
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
              <Badge label={c.queue.entityType} color={colors.navy} />
              <Text className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</Text>
            </View>
            {c.queue.error ? <Text className="mb-2 text-sm text-red-600">{c.queue.error}</Text> : null}
            <Text className="text-sm text-gray-600" numberOfLines={3}>
              {JSON.stringify(c.queue.payload)}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => resolve.mutate({ id: c.id, resolution: 'server' })}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2"
              >
                <Text className="text-center text-sm font-semibold text-navy">Keep server</Text>
              </Pressable>
              <Pressable
                onPress={() => resolve.mutate({ id: c.id, resolution: 'client' })}
                className="flex-1 rounded-xl bg-gold px-3 py-2"
              >
                <Text className="text-center text-sm font-semibold text-navy">Use local</Text>
              </Pressable>
            </View>
          </Card>
        ))}
        {!data?.data?.length ? <Text className="text-sm text-gray-400">No unresolved conflicts.</Text> : null}
      </ScrollView>
    </Screen>
  );
}
