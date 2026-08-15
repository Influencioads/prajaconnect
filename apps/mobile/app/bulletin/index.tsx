import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchBulletins } from '../../lib/bulletin';
import { Screen, ScreenHeader, ListRow, StatusPill, Loading, EmptyState, SectionTitle } from '../../components/ui';
import { colors } from '../../lib/theme';

const EDITION_ORDER = ['daily', 'weekly', 'monthly'] as const;
const EDITION_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export default function BulletinArchive() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ['m-bulletins'], queryFn: () => fetchBulletins() });

  const items = data?.data ?? [];

  return (
    <Screen>
      <ScreenHeader title="Daily Bulletin" subtitle="Your 5 AM constituency briefing" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <Loading label="Loading bulletins…" />
        ) : items.length === 0 ? (
          <EmptyState title="No bulletins yet" subtitle="Bulletins are generated automatically at 5 AM." icon="newspaper-outline" />
        ) : (
          EDITION_ORDER.map((edition) => {
            const rows = items.filter((b) => b.edition === edition);
            if (!rows.length) return null;
            return (
              <View key={edition}>
                <SectionTitle>{EDITION_LABELS[edition]}</SectionTitle>
                {rows.map((b) => (
                  <ListRow
                    key={b.id}
                    title={new Date(b.date).toDateString()}
                    subtitle={b.narrative?.split('\n')[0]}
                    icon="newspaper"
                    tint={colors.navy}
                    right={<StatusPill status={b.status} />}
                    onPress={() => router.push(`/bulletin/${b.id}`)}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
