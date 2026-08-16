import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchLeaderboard, fetchMandalScorecards } from '../../lib/scorecards';
import { Screen, ScreenHeader, Card, Badge, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

const PERIODS = ['daily', 'weekly', 'monthly'] as const;

type MandalRow = {
  id: string;
  rank: number;
  composite: number;
  rankDelta: number;
  attendanceRate: number;
  d2dCoverage: number;
  mandal: { name: string };
};

type Entry = {
  rank: number;
  points: number;
  checkIns: number;
  d2dVisits: number;
  cadre: { id: string; name: string; mandal: { name: string } | null };
};

function trend(delta: number) {
  if (delta > 0) return { label: `▲ ${delta}`, color: colors.success };
  if (delta < 0) return { label: `▼ ${Math.abs(delta)}`, color: colors.danger };
  return { label: '—', color: colors.muted };
}

export default function ScorecardsMobile() {
  const router = useRouter();
  const [period, setPeriod] = React.useState<string>('daily');

  const mandals = useQuery({ queryKey: ['m-scorecards'], queryFn: () => fetchMandalScorecards() });
  const leaderboard = useQuery({
    queryKey: ['m-leaderboard', period],
    queryFn: () => fetchLeaderboard(period),
  });

  const rows: MandalRow[] = mandals.data?.data ?? [];
  const entries: Entry[] = leaderboard.data?.data ?? [];
  // `me` is only returned when the signed-in user is linked to a Cadre record.
  const me: Entry | null = leaderboard.data?.me ?? null;

  return (
    <Screen>
      <ScreenHeader title="Scorecards" subtitle="Mandal ranking & cadre leaderboard" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="mb-2 text-sm font-bold text-navy">Mandal Ranking</Text>
        {rows.length === 0 ? (
          <EmptyState title="No scorecards yet" subtitle="Computed daily at 05:30." />
        ) : (
          rows.map((r) => {
            const t = trend(r.rankDelta);
            return (
              <Card key={r.id} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-navy" numberOfLines={1}>
                      #{r.rank} {r.mandal.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">
                      Attendance {r.attendanceRate.toFixed(0)}% · D2D {r.d2dCoverage.toFixed(0)}%
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-navy">{r.composite.toFixed(1)}</Text>
                    <Text className="text-xs font-semibold" style={{ color: t.color }}>
                      {t.label}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        <Text className="mb-2 mt-5 text-sm font-bold text-navy">Leaderboard</Text>
        <View className="mb-3 flex-row gap-2">
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className="rounded-full border px-3 py-1.5"
              style={{
                borderColor: period === p ? colors.navy : colors.border,
                backgroundColor: period === p ? colors.navy : colors.white,
              }}
            >
              <Text className="text-xs font-semibold capitalize" style={{ color: period === p ? colors.white : colors.muted }}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>

        {me ? (
          <Card className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs text-gray-500">Your rank</Text>
                <Text className="text-lg font-bold text-navy">
                  #{me.rank} · {me.cadre.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {me.checkIns} check-ins · {me.d2dVisits} D2D visits
                </Text>
              </View>
              <Badge label={`${me.points} pts`} color={colors.gold} />
            </View>
          </Card>
        ) : null}

        {entries.length === 0 ? (
          <EmptyState title="No leaderboard data" subtitle="Points are awarded with the daily run." />
        ) : (
          entries.map((e) => (
            <View
              key={e.cadre.id}
              className="mb-2 flex-row items-center justify-between rounded-2xl border bg-white p-3"
              style={{ borderColor: me?.cadre.id === e.cadre.id ? colors.gold : colors.border }}
            >
              <Text className="w-10 text-base font-bold text-navy">#{e.rank}</Text>
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-navy" numberOfLines={1}>
                  {e.cadre.name}
                </Text>
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  {e.cadre.mandal?.name ?? 'Unassigned'}
                </Text>
              </View>
              <Text className="text-sm font-bold text-navy">{e.points}</Text>
            </View>
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
