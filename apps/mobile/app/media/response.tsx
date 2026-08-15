import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Alert, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchAttacks, fetchMediaResponses, createMediaResponse } from '../../lib/media';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, Field, PrimaryButton, Badge, SectionTitle } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function MediaResponse() {
  const router = useRouter();
  const { attackId } = useLocalSearchParams<{ attackId?: string }>();
  const qc = useQueryClient();
  const [selectedAttack, setSelectedAttack] = React.useState(attackId ?? '');
  const [content, setContent] = React.useState('');

  const { data: attacks } = useQuery({
    queryKey: ['m-media-attacks'],
    queryFn: () => fetchAttacks({ page: 1, limit: 20 }),
  });

  const { data: responses } = useQuery({
    queryKey: ['m-media-responses'],
    queryFn: () => fetchMediaResponses({ page: 1, limit: 10, status: 'Draft' }),
  });

  const submit = useMutation({
    mutationFn: () => createMediaResponse({ attackId: selectedAttack, content, status: 'Draft' }),
    onSuccess: () => {
      Alert.alert('Saved', 'Response draft submitted.', [{ text: 'OK', onPress: () => router.back() }]);
      qc.invalidateQueries({ queryKey: ['m-media-responses'] });
      qc.invalidateQueries({ queryKey: ['m-media-dash'] });
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Media Response" subtitle="Draft a response to an attack" onBack={() => router.back()} />

        <Card className="mb-4">
          <SectionTitle className="mt-0">Select attack</SectionTitle>
          {(attacks?.data ?? []).map((a) => (
            <Text
              key={a.id}
              onPress={() => setSelectedAttack(a.id)}
              className={`mb-2 rounded-xl border px-3 py-2 text-sm ${selectedAttack === a.id ? 'border-navy bg-navy/5 font-semibold text-navy' : 'border-line text-muted'}`}
            >
              {a.title}
            </Text>
          ))}
          <Field label="Response content *" value={content} onChangeText={setContent} multiline placeholder="Draft your rebuttal…" />
          <PrimaryButton
            label={submit.isPending ? 'Saving…' : 'Save draft'}
            icon="document-text"
            onPress={selectedAttack && content ? () => submit.mutate() : undefined}
            loading={submit.isPending}
          />
        </Card>

        <SectionTitle>Recent Drafts</SectionTitle>
        {(responses?.data ?? []).map((r) => (
          <Card key={r.id} className="mb-2">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="font-medium text-ink" numberOfLines={1}>{r.attack?.title ?? 'Attack'}</Text>
              <Badge label={r.status} color={colors.warning} />
            </View>
            <Text className="text-sm text-muted" numberOfLines={3}>{r.content}</Text>
          </Card>
        ))}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
