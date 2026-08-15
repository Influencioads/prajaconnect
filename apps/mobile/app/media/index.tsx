import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchMediaDashboard } from '../../lib/media';
import { Screen, ScreenHeader, KpiTile, PrimaryButton, SectionTitle, ListRow, StatusPill } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function MediaIndex() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['m-media-dash'], queryFn: fetchMediaDashboard });

  return (
    <Screen>
      <ScreenHeader title="Media" subtitle="Reputation & opposition tracking" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          <KpiTile label="Pending attacks" value={data?.pendingAttacks ?? 0} icon="alert-circle" accent={colors.danger} />
          <KpiTile label="Draft responses" value={data?.draftResponses ?? 0} icon="document-text" accent={colors.warning} />
        </View>
        <View className="flex-row gap-3">
          <KpiTile label="Reputation" value={data?.reputationScore ?? 0} icon="ribbon" accent={colors.success} />
          <KpiTile label="News" value={data?.totalNews ?? 0} icon="newspaper" accent={colors.info} />
        </View>
        <PrimaryButton variant="gold" icon="send" label="Submit Response" onPress={() => router.push('/media/response')} className="mt-1" />
        <SectionTitle>Recent Attacks</SectionTitle>
        {(data?.recentAttacks ?? []).map((a) => (
          <ListRow
            key={a.id}
            title={a.title}
            right={<StatusPill status={a.responseStatus} />}
            icon="warning"
            tint={colors.danger}
          />
        ))}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
