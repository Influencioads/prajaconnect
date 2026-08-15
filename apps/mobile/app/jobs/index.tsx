import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchJobPostings, daysLeft } from '../../lib/jobs';
import { Screen, ScreenHeader, SectionTitle, ListRow, StatusPill, EmptyState, Loading } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function JobsIndex() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['m-job-postings'],
    queryFn: () => fetchJobPostings({ limit: 50 }),
  });

  const postings = data?.data ?? [];
  const open = postings.filter((p) => p.status === 'New' || p.status === 'Reviewed');
  const rest = postings.filter((p) => p.status !== 'New' && p.status !== 'Reviewed');

  return (
    <Screen>
      <ScreenHeader title="Govt Jobs" subtitle="Job notifications for local youth" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? <Loading label="Loading postings…" /> : null}

        {open.length > 0 && <SectionTitle>Open Notifications</SectionTitle>}
        {open.map((p) => (
          <ListRow
            key={p.id}
            title={p.title}
            subtitle={[p.organization, daysLeft(p.lastDate)].filter(Boolean).join(' · ') || undefined}
            icon="briefcase"
            tint={colors.info}
            right={<StatusPill status={p.status} />}
            onPress={() => router.push(`/jobs/${p.id}`)}
          />
        ))}

        {rest.length > 0 && <SectionTitle>Dispatched & Expired</SectionTitle>}
        {rest.map((p) => (
          <ListRow
            key={p.id}
            title={p.title}
            subtitle={p.organization ?? undefined}
            icon="briefcase"
            tint={colors.muted}
            right={<StatusPill status={p.status} />}
            onPress={() => router.push(`/jobs/${p.id}`)}
          />
        ))}

        {!isLoading && postings.length === 0 ? (
          <EmptyState title="No job postings" subtitle="New notifications appear after the next ingestion run." icon="briefcase-outline" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
