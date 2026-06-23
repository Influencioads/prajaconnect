import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/crm';
import { Screen, ScreenHeader, Card, Badge, Loading, EmptyState } from '../components/ui';
import { colors } from '../lib/theme';

const typeColor: Record<string, string> = {
  Info: colors.navy,
  Warning: colors.warning,
  Alert: colors.danger,
  Success: colors.success,
};

function timeAgo(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-notifications'],
    queryFn: fetchNotifications,
  });

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-notifications'] });
      qc.invalidateQueries({ queryKey: ['m-unread'] });
    },
  });
  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-notifications'] });
      qc.invalidateQueries({ queryKey: ['m-unread'] });
    },
  });

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <ScreenHeader title="Notifications" onBack={() => router.back()} />
        <Pressable onPress={() => readAll.mutate()} className="active:opacity-70">
          <Text className="text-sm font-semibold text-navy">Mark all read</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No notifications" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => !item.read && readOne.mutate(item.id)}>
              <Card className="mb-2" >
                <View className="flex-row items-center justify-between">
                  <Badge label={item.type} color={typeColor[item.type] ?? colors.muted} />
                  {!item.read ? <View className="h-2.5 w-2.5 rounded-full bg-gold" /> : null}
                </View>
                <Text className="mt-1.5 text-base font-semibold text-navy">{item.title}</Text>
                {item.body ? <Text className="mt-0.5 text-sm text-gray-600">{item.body}</Text> : null}
                <Text className="mt-1 text-xs text-gray-400">{timeAgo(item.createdAt)}</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
