import * as React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTempGrievances } from '../../lib/crm';
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
      <ScreenHeader title={isAll ? 'All Temp Grievances' : 'My Validation Queue'} onBack={() => router.back()} />
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState title="No items" subtitle="Validation queue is empty." />}
        renderItem={({ item }) => (
          <ListRow
            title={item.tempTicketId}
            subtitle={`${item.citizenName ?? 'Citizen'} · ${item.source} · ${item.issueSummary ?? item.issueCategory ?? ''}`}
            right={<StatusPill status={item.validationStatus} />}
            onPress={() => router.push(`/temp-grievances/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}
