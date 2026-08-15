import * as React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTempGrievances } from '../../lib/crm';
import { colors, statusColor } from '../../lib/theme';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState } from '../../components/ui';

export default function TempGrievanceQueue() {
  const router = useRouter();
  const { all } = useLocalSearchParams<{ all?: string }>();
  const isAll = all === '1';

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-temp-queue', isAll],
    queryFn: () => fetchTempGrievances(isAll ? {} : { status: 'PendingValidation', scope: 'me' }),
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <ScreenHeader
        title={isAll ? 'All Temp Grievances' : 'My Validation Queue'}
        subtitle={isAll ? 'Browse and search all records' : 'Items waiting for validation'}
        onBack={() => router.back()}
      />
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState title="No items" subtitle="Validation queue is empty." icon="checkmark-done" />}
        ListFooterComponent={<View className="h-6" />}
        renderItem={({ item }) => (
          <ListRow
            title={item.tempTicketId}
            subtitle={`${item.citizenName ?? 'Citizen'} · ${item.source} · ${item.issueSummary ?? item.issueCategory ?? ''}`}
            icon="document-text"
            tint={statusColor[item.validationStatus] ?? colors.warning}
            right={<StatusPill status={item.validationStatus} />}
            onPress={() => router.push(`/temp-grievances/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}
