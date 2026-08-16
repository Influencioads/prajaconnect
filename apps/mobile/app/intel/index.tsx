import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchBoothPriority, fetchD2dInsight, type BoothFactor } from '../../lib/intel';
import {
  Screen,
  ScreenHeader,
  Card,
  Badge,
  KpiTile,
  Loading,
  EmptyState,
  SectionTitle,
  SegmentedTabs,
} from '../../components/ui';
import { colors } from '../../lib/theme';

const riskColor = (score: number) =>
  score >= 70 ? colors.danger : score >= 45 ? colors.warning : colors.success;

function FactorBar({ factor }: { factor: BoothFactor }) {
  return (
    <View className="mt-1.5">
      <View className="flex-row justify-between">
        <Text className="text-[11px] text-muted" numberOfLines={1}>
          {factor.label} · {factor.weight}%
        </Text>
        <Text className="text-[11px] font-bold text-ink">{factor.value}</Text>
      </View>
      <View className="mt-1 h-1.5 w-full rounded-full" style={{ backgroundColor: colors.border }}>
        <View
          className="h-1.5 rounded-full"
          style={{ width: `${Math.min(100, factor.value)}%`, backgroundColor: riskColor(factor.value) }}
        />
      </View>
    </View>
  );
}

export default function IntelMobile() {
  const router = useRouter();
  const [tab, setTab] = React.useState<'booths' | 'issues'>('booths');

  const { data: booths, isLoading } = useQuery({
    queryKey: ['m-intel-booths'],
    queryFn: () => fetchBoothPriority(15),
  });
  const { data: insight } = useQuery({ queryKey: ['m-intel-d2d'], queryFn: fetchD2dInsight });

  return (
    <Screen>
      <ScreenHeader title="Intel" subtitle="Booth priorities & emerging issues" onBack={() => router.back()} />

      <View className="mt-1 flex-row gap-3">
        <KpiTile
          label="Net sentiment"
          value={`${insight?.sentimentShift?.current?.netPct ?? 0}%`}
          hint={`${insight?.sentimentShift?.current?.total ?? 0} responses`}
          icon="pulse"
          accent={colors.info}
        />
        <KpiTile
          label="Shift"
          value={`${(insight?.sentimentShift?.deltaNetPct ?? 0) > 0 ? '+' : ''}${insight?.sentimentShift?.deltaNetPct ?? 0}`}
          hint="vs prior period"
          icon="trending-up"
          accent={(insight?.sentimentShift?.deltaNetPct ?? 0) < 0 ? colors.danger : colors.success}
        />
      </View>

      <SegmentedTabs
        tabs={[
          { key: 'booths', label: 'Booth priority' },
          { key: 'issues', label: 'Emerging issues' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'booths' ? (
          isLoading ? (
            <Loading />
          ) : booths?.data?.length ? (
            booths.data.map((b) => (
              <Card key={b.boothId} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="font-bold text-ink">
                      Booth {b.number}
                      {b.name ? ` · ${b.name}` : ''}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted">
                      {b.village ?? '—'}
                      {b.mandal ? ` · ${b.mandal}` : ''}
                    </Text>
                  </View>
                  <Badge label={`Risk ${b.riskScore}`} color={riskColor(b.riskScore)} dot />
                </View>
                {b.factors.map((f) => (
                  <FactorBar key={f.key} factor={f} />
                ))}
              </Card>
            ))
          ) : (
            <EmptyState icon="map" title="No booths scored" subtitle="Booth and voter data are needed to rank risk." />
          )
        ) : insight?.emergingIssues?.length ? (
          <>
            <SectionTitle>Rising in the field</SectionTitle>
            {insight.emergingIssues.map((i) => (
              <Card key={i.issue} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 pr-2 font-bold text-ink">{i.issue}</Text>
                  <Badge
                    label={`${i.growth > 0 ? '+' : ''}${i.growth}%`}
                    color={i.growth >= 50 ? colors.danger : i.growth > 0 ? colors.warning : colors.muted}
                    dot
                  />
                </View>
                <Text className="mt-1 text-xs text-muted">
                  {i.priorCount} → {i.count} mentions
                  {i.areas.length ? ` · ${i.areas.join(', ')}` : ''}
                </Text>
              </Card>
            ))}
          </>
        ) : (
          <EmptyState icon="analytics" title="No insights yet" subtitle="Run D2D mining from the web dashboard." />
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
