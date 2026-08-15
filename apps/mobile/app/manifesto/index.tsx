import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchManifestoDashboard } from '../../lib/manifesto';
import { Screen, ScreenHeader, KpiTile, PrimaryButton, SectionTitle, ListRow, StatusPill } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function ManifestoIndex() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-manifesto-dash'], queryFn: fetchManifestoDashboard });

  return (
    <Screen>
      <ScreenHeader title="Manifesto" subtitle="Election promise tracker" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          <KpiTile label="Total promises" value={data?.totalPromises ?? 0} icon="flag" accent={colors.navy} />
          <KpiTile label="Avg completion" value={`${Math.round(data?.avgCompletionPct ?? 0)}%`} icon="trending-up" accent={colors.success} />
        </View>
        <PrimaryButton variant="gold" icon="megaphone" label="Post Field Update" onPress={() => router.push('/manifesto/update')} className="mt-1" />
        <SectionTitle>Recent Promises</SectionTitle>
        {(data?.recentPromises ?? []).map((p) => (
          <ListRow
            key={p.id}
            title={p.title}
            subtitle={`${p.completionPct}% · ${p.department ?? 'General'}`}
            right={<StatusPill status={p.workStatus} />}
            icon="flag"
            tint={colors.navy}
            onPress={() => router.push({ pathname: '/manifesto/update', params: { promiseId: p.id } })}
          />
        ))}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
