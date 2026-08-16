import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchOpsDarkZones, fetchOpsInactiveCadre, fetchOpsSla } from '../../lib/ops-alerts';
import { Screen, ScreenHeader, Card, Badge, EmptyState, Loading, SegmentedTabs } from '../../components/ui';
import { colors } from '../../lib/theme';

type Tab = 'sla' | 'inactive' | 'dark';

type SlaItem = {
  id: string;
  code: string;
  title: string;
  mandal: string | null;
  assignee: string | null;
  hoursLeft?: number;
  daysOverdue?: number;
  escalationLevel?: number;
};
type InactiveItem = {
  id: string;
  name: string;
  designation: string;
  mandal: string | null;
  booth: string | null;
  parentName: string | null;
};
type DarkVillage = { id: string; name: string; mandal: string | null };
type DarkBooth = { id: string; name: string; village: string | null };

export default function OpsAlerts() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('sla');

  const { data: sla, isLoading: slaLoading } = useQuery({ queryKey: ['m-ops-sla'], queryFn: fetchOpsSla });
  const { data: inactive, isLoading: inactiveLoading } = useQuery({
    queryKey: ['m-ops-inactive'],
    queryFn: fetchOpsInactiveCadre,
  });
  const { data: dark, isLoading: darkLoading } = useQuery({
    queryKey: ['m-ops-dark'],
    queryFn: fetchOpsDarkZones,
  });

  const slaRows: SlaItem[] = [...(sla?.breached ?? []), ...(sla?.atRisk ?? [])];

  return (
    <Screen>
      <ScreenHeader title="Ops Alerts" subtitle="SLA, inactive cadre & dark zones" onBack={() => router.back()} />
      <View className="mt-4">
        <SegmentedTabs<Tab>
          tabs={[
            { key: 'sla', label: `SLA (${(sla?.counts?.breached ?? 0) + (sla?.counts?.atRisk ?? 0)})` },
            { key: 'inactive', label: `Inactive (${inactive?.count ?? 0})` },
            { key: 'dark', label: `Dark (${(dark?.counts?.villages ?? 0) + (dark?.counts?.booths ?? 0)})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'sla' ? (
          slaLoading ? (
            <Loading />
          ) : slaRows.length ? (
            slaRows.map((g) => (
              <Card key={g.id} className="mb-2">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="flex-1 font-semibold" style={{ color: colors.navy }} numberOfLines={1}>
                    {g.code}
                  </Text>
                  {g.daysOverdue !== undefined ? (
                    <Badge label={`${g.daysOverdue}d overdue`} color={colors.danger} dot />
                  ) : (
                    <Badge label={`${g.hoursLeft}h left`} color={colors.warning} dot />
                  )}
                </View>
                <Text className="text-sm text-muted" numberOfLines={2}>{g.title}</Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {g.escalationLevel ? <Badge label={`Escalation L${g.escalationLevel}`} color={colors.violet} /> : null}
                  {g.assignee ? <Badge label={g.assignee} color={colors.navy} /> : null}
                  {g.mandal ? <Badge label={g.mandal} color={colors.muted} /> : null}
                </View>
              </Card>
            ))
          ) : (
            <EmptyState icon="shield-checkmark" title="All within SLA" subtitle="No grievances are breached or at risk." />
          )
        ) : null}

        {tab === 'inactive' ? (
          inactiveLoading ? (
            <Loading />
          ) : inactive?.data?.length ? (
            (inactive.data as InactiveItem[]).map((c) => (
              <Card key={c.id} className="mb-2">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="flex-1 font-semibold" style={{ color: colors.navy }} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Badge label={`${inactive.days}d silent`} color={colors.warning} dot />
                </View>
                <Text className="text-sm text-muted" numberOfLines={1}>
                  {c.designation}
                  {c.mandal ? ` · ${c.mandal}` : ''}
                  {c.booth ? ` · Booth ${c.booth}` : ''}
                </Text>
                {c.parentName ? (
                  <Text className="mt-0.5 text-xs text-faint">Reports to {c.parentName}</Text>
                ) : null}
              </Card>
            ))
          ) : (
            <EmptyState icon="people" title="No inactive cadre" subtitle={`Everyone was active in the last ${inactive?.days ?? 3} days.`} />
          )
        ) : null}

        {tab === 'dark' ? (
          darkLoading ? (
            <Loading />
          ) : (dark?.villages?.length || dark?.booths?.length) ? (
            <>
              {(dark.villages as DarkVillage[]).map((v) => (
                <Card key={`v-${v.id}`} className="mb-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="font-semibold" style={{ color: colors.navy }} numberOfLines={1}>{v.name}</Text>
                      <Text className="text-xs text-muted">Village{v.mandal ? ` · ${v.mandal}` : ''}</Text>
                    </View>
                    <Badge label={`${dark.days}d dark`} color={colors.danger} dot />
                  </View>
                </Card>
              ))}
              {(dark.booths as DarkBooth[]).map((b) => (
                <Card key={`b-${b.id}`} className="mb-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="font-semibold" style={{ color: colors.navy }} numberOfLines={1}>{b.name}</Text>
                      <Text className="text-xs text-muted">Booth{b.village ? ` · ${b.village}` : ''}</Text>
                    </View>
                    <Badge label={`${dark.days}d dark`} color={colors.muted} dot />
                  </View>
                </Card>
              ))}
            </>
          ) : (
            <EmptyState icon="map" title="No dark zones" subtitle={`Every village and booth had a touchpoint in the last ${dark?.days ?? 14} days.`} />
          )
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
