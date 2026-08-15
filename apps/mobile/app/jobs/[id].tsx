import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Alert, View, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchJobPosting, fetchJobMatches, dispatchJob, daysLeft } from '../../lib/jobs';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, PrimaryButton, StatusPill, EmptyState, Chip, SectionTitle, ListRow } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function JobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [channels, setChannels] = React.useState<string[]>(['sms']);

  const { data: posting } = useQuery({
    queryKey: ['m-job-posting', id],
    queryFn: () => fetchJobPosting(id!),
    enabled: !!id,
  });

  const { data: matches } = useQuery({
    queryKey: ['m-job-matches', id],
    queryFn: () => fetchJobMatches(id!),
    enabled: !!id,
  });

  const dispatch = useMutation({
    mutationFn: () => dispatchJob(id!, channels),
    onSuccess: (res) => {
      Alert.alert('Dispatched', `Sent to ${res.citizenCount} citizens.`, [{ text: 'OK', onPress: () => router.back() }]);
      qc.invalidateQueries({ queryKey: ['m-job-postings'] });
      qc.invalidateQueries({ queryKey: ['m-job-posting', id] });
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  if (!id) {
    return (
      <Screen>
        <ScreenHeader title="Job" onBack={() => router.back()} />
        <EmptyState title="No posting selected" subtitle="Open a posting from the jobs list first." icon="briefcase" />
      </Screen>
    );
  }

  const countdown = daysLeft(posting?.lastDate);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Job Posting" subtitle={posting?.source?.name} onBack={() => router.back()} />

        {posting && (
          <Card className="mb-4">
            <Text className="text-lg font-bold text-ink">{posting.title}</Text>
            {posting.summary ? <Text className="mt-1 text-sm text-muted">{posting.summary}</Text> : null}
            <View className="mt-2 flex-row flex-wrap gap-2">
              <StatusPill status={posting.status} />
              {countdown ? <StatusPill status={countdown} /> : null}
            </View>
            <View className="mt-3 gap-1">
              {posting.organization ? <Text className="text-sm text-ink">Organization: {posting.organization}</Text> : null}
              {posting.qualification ? <Text className="text-sm text-ink">Qualification: {posting.qualification}</Text> : null}
              {posting.minAge != null || posting.maxAge != null ? (
                <Text className="text-sm text-ink">Age: {posting.minAge ?? '—'} – {posting.maxAge ?? '—'}</Text>
              ) : null}
              {posting.district ? <Text className="text-sm text-ink">District: {posting.district}</Text> : null}
              {posting.lastDate ? (
                <Text className="text-sm text-ink">Last date: {new Date(posting.lastDate).toLocaleDateString()}</Text>
              ) : null}
            </View>
            {posting.url ? (
              <PrimaryButton
                variant="outline"
                icon="open-outline"
                label="Open notification"
                onPress={() => Linking.openURL(posting.url!)}
                className="mt-3"
              />
            ) : null}
          </Card>
        )}

        <Card className="mb-4">
          <Text className="text-sm font-bold text-ink">Dispatch channels</Text>
          <View className="mt-2 flex-row gap-2">
            {['sms', 'whatsapp'].map((c) => (
              <Chip key={c} label={c.toUpperCase()} active={channels.includes(c)} onPress={() => toggleChannel(c)} />
            ))}
          </View>
          <PrimaryButton
            label={
              dispatch.isPending
                ? 'Dispatching…'
                : `Dispatch to ${matches?.withMobile ?? 0} matching citizens`
            }
            icon="send"
            onPress={() =>
              Alert.alert(
                'Confirm dispatch',
                `Send this job to ${matches?.withMobile ?? 0} citizens with mobile numbers?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Dispatch', onPress: () => dispatch.mutate() },
                ],
              )
            }
            loading={dispatch.isPending}
            disabled={!matches || matches.withMobile === 0}
            className="mt-3"
          />
        </Card>

        <SectionTitle>Matching citizens ({matches?.count ?? 0})</SectionTitle>
        {(matches?.preview ?? []).map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={[c.age != null ? `${c.age} yrs` : null, c.occupation].filter(Boolean).join(' · ') || undefined}
            icon="person"
            tint={colors.teal}
          />
        ))}
        {matches && matches.count === 0 ? (
          <EmptyState title="No matching citizens" subtitle="No citizens match the qualification and age filters." icon="people" />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
