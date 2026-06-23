import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Alert, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchCrisisIssue, updateCrisisIssue, addCrisisTimelineEntry } from '../../lib/crisis';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, Field, PrimaryButton, Badge } from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

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
        <Text className="text-gray-500">No issue selected.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Acknowledge Issue" subtitle="Confirm receipt and add field notes" onBack={() => router.back()} />

        {issue && (
          <Card className="mb-4">
            <Text className="text-lg font-bold text-navy">{issue.title}</Text>
            {issue.description ? <Text className="mt-1 text-sm text-gray-600">{issue.description}</Text> : null}
            <View className="mt-2 flex-row gap-2">
              <Badge label={issue.severity} color={statusColor[issue.severity] ?? colors.navy} />
              <Badge label={issue.status} color={colors.gold} />
            </View>
          </Card>
        )}

        <Card className="mb-4">
          <Field label="Field note (optional)" value={note} onChangeText={setNote} multiline placeholder="On-site assessment…" />
          <PrimaryButton
            label={acknowledge.isPending ? 'Saving…' : 'Acknowledge & activate'}
            onPress={() => acknowledge.mutate()}
            loading={acknowledge.isPending}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
