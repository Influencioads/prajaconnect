import * as React from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { AppointmentStatus } from '@praja/types';
import { fetchLeaderAppointments } from '../../../lib/leader-office';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState, ErrorState } from '../../../components/ui';
import { colors } from '../../../lib/theme';

const STATUS_FILTERS: { label: string; value?: AppointmentStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Completed', value: 'Completed' },
];

export default function AppointmentsList() {
  const router = useRouter();
  const [status, setStatus] = React.useState<AppointmentStatus | undefined>(undefined);

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['m-leader-appointments', { status }],
      queryFn: ({ pageParam }) =>
        fetchLeaderAppointments({ page: pageParam, limit: 20, status }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    });

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Screen>
      <ScreenHeader title="Appointments" subtitle="Visitor appointment requests" onBack={() => router.back()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 max-h-10 flex-grow-0">
        <View className="flex-row gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setStatus(f.value)}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}
              >
                <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState title="Couldn't load appointments" onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No appointments" subtitle="Create one with the + button." />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : null}
          renderItem={({ item }) => (
            <ListRow
              title={item.visitorName}
              subtitle={`${item.purpose}${item.scheduledAt ? ` · ${new Date(item.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/leader-office/appointments/${item.id}` as Href)}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => router.push('/leader-office/appointments/new' as Href)}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-navy shadow-lg active:opacity-90"
      >
        <Text className="text-3xl text-white" style={{ marginTop: -2 }}>+</Text>
      </Pressable>
    </Screen>
  );
}
