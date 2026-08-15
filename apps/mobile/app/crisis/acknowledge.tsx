import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Alert, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchCrisisIssue, updateCrisisIssue, addCrisisTimelineEntry } from '../../lib/crisis';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, Field, PrimaryButton, StatusPill, EmptyState } from '../../components/ui';

export default function CrisisAcknowledge() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [note, setNote] = React.useState('');

  const { data: issue } = useQuery({
    queryKey: ['m-crisis-issue', id],
    queryFn: () => fetchCrisisIssue(id!),
    enabled: !!id,
  });

  const acknowledge = useMutation({
    mutationFn: async () => {
      await updateCrisisIssue(id!, { status: 'Active' });
      if (note.trim()) await addCrisisTimelineEntry(id!, note.trim());
    },
    onSuccess: () => {
      Alert.alert('Acknowledged', 'Issue marked active.', [{ text: 'OK', onPress: () => router.back() }]);
      qc.invalidateQueries({ queryKey: ['m-crisis-dash'] });
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  if (!id) {
    return (
      <Screen>
        <ScreenHeader title="Acknowledge" onBack={() => router.back()} />
        <EmptyState title="No issue selected" subtitle="Open an issue from the crisis dashboard first." icon="alert-circle" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Acknowledge Issue" subtitle="Confirm receipt and add field notes" onBack={() => router.back()} />

        {issue && (
          <Card className="mb-4">
            <Text className="text-lg font-bold text-ink">{issue.title}</Text>
            {issue.description ? <Text className="mt-1 text-sm text-muted">{issue.description}</Text> : null}
            <View className="mt-2 flex-row gap-2">
              <StatusPill status={issue.severity} />
              <StatusPill status={issue.status} />
            </View>
          </Card>
        )}

        <Card className="mb-4">
          <Field label="Field note (optional)" value={note} onChangeText={setNote} multiline placeholder="On-site assessment…" icon="clipboard" />
          <PrimaryButton
            label={acknowledge.isPending ? 'Saving…' : 'Acknowledge & activate'}
            onPress={() => acknowledge.mutate()}
            loading={acknowledge.isPending}
            icon="checkmark-circle"
          />
        </Card>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
