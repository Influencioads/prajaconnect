import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchOppositionFeed, fetchVisitCoverage } from '../../lib/ground-intel';
import { useAuth } from '../../lib/auth';
import { Screen, Card, Badge, ScreenHeader, KpiTile, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

const BUCKET_COLOR: Record<string, string> = {
  green: colors.success,
  amber: colors.warning,
  red: colors.danger,
};

export default function GroundIntelIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const mandalId = user?.mandalId ?? undefined;

  const { data: feed } = useQuery({
    queryKey: ['m-gi-feed', mandalId],
    queryFn: () => fetchOppositionFeed({ mandalId }),
  });
  const { data: visits } = useQuery({
    queryKey: ['m-gi-visits', mandalId],
    queryFn: () => fetchVisitCoverage(mandalId),
  });

  // Stalest first — that is the whole point of the list on a phone.
  const stale = [...(visits?.villages ?? [])]
    .sort(
      (a, b) =>
        (b.daysSince ?? Number.MAX_SAFE_INTEGER) - (a.daysSince ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, 15);

  return (
    <Screen>
      <ScreenHeader
        title="Ground Intel"
        subtitle={mandalId ? 'Opposition feed & your mandal visit gaps' : 'Opposition feed & visit gaps'}
        onBack={() => router.back()}
      />
      <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.push('/ground-intel/opposition-log')} className="mb-4 rounded-xl bg-gold px-4 py-3">
          <Text className="text-center font-semibold" style={{ color: colors.navy }}>
            Log opposition activity
          </Text>
        </Pressable>

        <View className="flex-row gap-2">
          <KpiTile label="Visited < 30d" value={visits?.summary.green ?? 0} accent={colors.success} />
          <KpiTile label="30–90d" value={visits?.summary.amber ?? 0} accent={colors.warning} />
          <KpiTile label="90d+ / never" value={visits?.summary.red ?? 0} accent={colors.danger} />
        </View>

        <Text className="mb-2 mt-2 text-sm font-semibold text-navy">Visit staleness</Text>
        {stale.length ? (
          stale.map((v) => (
            <Card key={v.villageId} className="mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-medium text-navy" numberOfLines={1}>
                  {v.villageName}
                </Text>
                <Badge
                  label={v.daysSince === null ? 'Never' : `${v.daysSince}d`}
                  color={BUCKET_COLOR[v.bucket] ?? colors.navy}
                />
              </View>
              <Text className="mt-1 text-xs text-slate-500">
                {v.mandalName ?? '—'}
                {v.lastVisitAt ? ` · last ${new Date(v.lastVisitAt).toLocaleDateString()}` : ''}
              </Text>
            </Card>
          ))
        ) : (
          <EmptyState title="No villages" subtitle="Nothing assigned to your mandal yet." />
        )}

        <Text className="mb-2 mt-4 text-sm font-semibold text-navy">Recent opposition reports</Text>
        {(feed?.data ?? []).length ? (
          (feed?.data ?? []).map((a) => (
            <Card key={a.id} className="mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-medium text-navy" numberOfLines={1}>
                  {a.rivalName}
                  {a.party ? ` · ${a.party}` : ''}
                </Text>
                <Badge label={a.activityType} color={colors.navy} />
              </View>
              <Text className="mt-1 text-sm text-slate-600" numberOfLines={3}>
                {a.description}
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                {[a.village?.name, a.mandal?.name].filter(Boolean).join(' · ') || 'Location not set'}
                {a.headcount ? ` · ~${a.headcount}` : ''} · {new Date(a.occurredAt).toLocaleDateString()}
              </Text>
            </Card>
          ))
        ) : (
          <EmptyState title="Nothing reported" subtitle="Be the first to log rival activity from the field." />
        )}
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
