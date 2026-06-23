import * as React from 'react';
import { View, Text, SectionList, RefreshControl, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { LeaderCalendarItem } from '@praja/types';
import { fetchLeaderCalendar } from '../../lib/leader-office';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState, Badge } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function LeaderCalendar() {
  const router = useRouter();
  const [cursor, setCursor] = React.useState(() => new Date());
  const range = React.useMemo(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };
  }, [cursor]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-leader-calendar', range],
    queryFn: () => fetchLeaderCalendar({ from: range.from, to: range.to }),
  });

  const sections = React.useMemo(() => {
    const map = new Map<string, LeaderCalendarItem[]>();
    for (const it of data?.items ?? []) {
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

  const shiftMonth = (delta: number) => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  return (
    <Screen>
      <ScreenHeader title="Calendar" subtitle="Appointments & schedule blocks" onBack={() => router.back()} />

      <View className="mb-3 flex-row items-center justify-between">
        <Pressable onPress={() => shiftMonth(-1)} className="rounded-lg border border-gray-200 px-3 py-2">
          <Text className="font-semibold text-navy">‹</Text>
        </Pressable>
        <Text className="text-sm font-bold text-navy">{range.label}</Text>
        <Pressable onPress={() => shiftMonth(1)} className="rounded-lg border border-gray-200 px-3 py-2">
          <Text className="font-semibold text-navy">›</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Loading />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="Nothing scheduled" subtitle="No items this month." />}
          renderSectionHeader={({ section }) => (
            <Text className="mb-2 mt-3 text-sm font-bold text-navy">{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={
                item.kind === 'appointment'
                  ? `Appointment · ${new Date(item.startAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  : `Block · ${new Date(item.startAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}${item.endAt ? ` – ${new Date(item.endAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`
              }
              right={
                item.kind === 'appointment' && item.status ? (
                  <StatusPill status={item.status} />
                ) : (
                  <Badge label="Block" color={colors.muted} />
                )
              }
              onPress={
                item.kind === 'appointment'
                  ? () => router.push(`/leader-office/appointments/${item.id}` as Href)
                  : () => router.push('/leader-office/schedule')
              }
            />
          )}
        />
      )}
    </Screen>
  );
}
