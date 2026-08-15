import * as React from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiError } from '../../lib/api';
import { MATCH_STATUSES, fetchWorklist, updateMatchStatus } from '../../lib/camps';
import {
  Screen,
  ScreenHeader,
  Chip,
  Card,
  Badge,
  StatusPill,
  Loading,
  EmptyState,
} from '../../components/ui';
import { colors } from '../../lib/theme';

const ALL = 'All';

export default function Worklist() {
  const router = useRouter();
  const qc = useQueryClient();
  const [status, setStatus] = React.useState(ALL);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['m-worklist', status],
    queryFn: () => fetchWorklist(status === ALL ? undefined : status),
  });

  const mut = useMutation({
    mutationFn: ({ matchId, newStatus }: { matchId: string; newStatus: string }) =>
      updateMatchStatus(matchId, newStatus),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['m-worklist'] }),
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  return (
    <Screen>
      <ScreenHeader
        title="My scheme worklist"
        subtitle="Citizens in your booth matched to welfare schemes"
        onBack={() => router.back()}
      />

      <View className="mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[ALL, ...MATCH_STATUSES].map((s) => (
              <Chip key={s} label={s} active={status === s} onPress={() => setStatus(s)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {isLoading ? (
        <Loading />
      ) : !data?.cadre ? (
        <EmptyState
          title="No cadre profile"
          subtitle="Your account is not linked to a cadre with a booth assignment."
          icon="person-outline"
        />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No matches" subtitle="New scheme matches for your booth appear here after the nightly matcher run." icon="ribbon-outline" />}
          ListFooterComponent={<View className="h-6" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
              <Card className="mb-2.5">
                <View className="flex-row items-center">
                  <View className="flex-1 pr-2">
                    <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>{item.citizen.name}</Text>
                    <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
                      {item.scheme.name} · {item.score}% match
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-faint" numberOfLines={1}>
                      {item.citizen.mobile ?? '—'}
                      {item.citizen.booth?.number ? ` · Booth ${item.citizen.booth.number}` : ''}
                      {item.citizen.village?.name ? ` · ${item.citizen.village.name}` : ''}
                    </Text>
                  </View>
                  <StatusPill status={item.status} />
                </View>

                {expanded === item.id ? (
                  <View className="mt-3 border-t border-line pt-3">
                    <Text className="mb-2 text-xs font-semibold text-muted">Update status</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {MATCH_STATUSES.map((s) => (
                        <Chip
                          key={s}
                          label={s}
                          active={item.status === s}
                          onPress={() => mut.mutate({ matchId: item.id, newStatus: s })}
                        />
                      ))}
                    </View>
                    {item.scheme.benefitAmount ? (
                      <View className="mt-2.5 flex-row">
                        <Badge label={`Benefit ₹${item.scheme.benefitAmount}`} color={colors.success} />
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
