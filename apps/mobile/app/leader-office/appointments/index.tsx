import * as React from 'react';
import { View, FlatList, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { AppointmentStatus } from '@praja/types';
import { fetchLeaderAppointments } from '../../../lib/leader-office';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState, ErrorState, Chip, PrimaryButton } from '../../../components/ui';
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
      <ScreenHeader
        title="Appointments"
        subtitle="Visitor appointment requests"
        onBack={() => router.back()}
        right={
          <PrimaryButton
            small
            label="New"
            icon="add"
            onPress={() => router.push('/leader-office/appointments/new' as Href)}
          />
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 max-h-10 flex-grow-0">
        <View className="flex-row gap-2">
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.label} label={f.label} active={status === f.value} onPress={() => setStatus(f.value)} />
          ))}
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
          ListEmptyComponent={<EmptyState title="No appointments" subtitle="Tap New to create one." icon="calendar" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator className="py-4" color={colors.navy} /> : <View className="h-6" />
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.visitorName}
              avatar
              subtitle={`${item.purpose}${item.scheduledAt ? ` · ${new Date(item.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`}
              right={<StatusPill status={item.status} />}
              onPress={() => router.push(`/leader-office/appointments/${item.id}` as Href)}
            />
          )}
        />
      )}
    </Screen>
  );
}
