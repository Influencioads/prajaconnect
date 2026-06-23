import * as React from 'react';
import { View, Text, SectionList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityCalendar, type CalendarItem } from '../../lib/crm';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState } from '../../components/ui';

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function ActivityCalendar() {
  const router = useRouter();
  const range = React.useMemo(monthRange, []);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-activity-calendar', range],
    queryFn: () => fetchActivityCalendar(range),
  });

  const sections = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of data?.items ?? []) {
      if (!it.date) continue;
      const key = it.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, items]) => ({
        title: new Date(day).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }),
        data: items,
      }));
  }, [data]);

  return (
    <Screen>
      <ScreenHeader title="Calendar" subtitle="Scheduled activities & events" onBack={() => router.back()} />
      {isLoading ? (
        <Loading />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="Nothing scheduled" subtitle="No activities this month." />}
          renderSectionHeader={({ section }) => (
            <Text className="mb-2 mt-3 text-sm font-bold text-navy">{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={item.kind === 'event' ? 'Event' : item.type}
              right={<StatusPill status={item.status} />}
              onPress={item.kind === 'activity' ? () => router.push(`/activities/${item.id}`) : undefined}
            />
          )}
        />
      )}
    </Screen>
  );
}
