import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchCrisisDashboard } from '../../lib/crisis';
import { Screen, ScreenHeader, KpiTile, SectionTitle, ListRow, StatusPill, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function CrisisIndex() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-crisis-dash'], queryFn: fetchCrisisDashboard });
  const openIssues = (data?.recentIssues ?? []).filter((i) => i.status === 'Open' || i.status === 'Active');

  return (
    <Screen>
      <ScreenHeader title="Crisis" subtitle="Emergency issue monitoring" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          <KpiTile label="Open" value={data?.openIssues ?? 0} accent={colors.danger} icon="alert-circle" />
          <KpiTile label="Active" value={data?.activeIssues ?? 0} accent={colors.warning} icon="flag" />
        </View>
        <SectionTitle>Open Issues</SectionTitle>
        {openIssues.map((issue) => (
          <ListRow
            key={issue.id}
            title={issue.title}
            subtitle={issue.status}
            icon="warning"
            tint={colors.danger}
            right={<StatusPill status={issue.severity} />}
            onPress={() => router.push({ pathname: '/crisis/acknowledge', params: { id: issue.id } })}
          />
        ))}
        {openIssues.length === 0 ? (
          <EmptyState title="No open issues" subtitle="All clear right now." icon="shield-checkmark" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
