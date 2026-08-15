import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Alert, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchPromises, fetchPromise, createPublicUpdate } from '../../lib/manifesto';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, Field, PrimaryButton, Badge, StatusPill, SectionTitle } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function ManifestoUpdate() {
  const router = useRouter();
  const { promiseId } = useLocalSearchParams<{ promiseId?: string }>();
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState(promiseId ?? '');
  const [note, setNote] = React.useState('');

  const { data: list } = useQuery({
    queryKey: ['m-manifesto-promises'],
    queryFn: () => fetchPromises({ page: 1, limit: 20 }),
  });

  const { data: detail } = useQuery({
    queryKey: ['m-manifesto-promise', selected],
    queryFn: () => fetchPromise(selected),
    enabled: !!selected,
  });

  const submit = useMutation({
    mutationFn: () => createPublicUpdate({ promiseId: selected, note, isPublic: true }),
    onSuccess: () => {
      Alert.alert('Posted', 'Public update recorded.', [{ text: 'OK', onPress: () => router.back() }]);
      qc.invalidateQueries({ queryKey: ['m-manifesto-dash'] });
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Promise Update" subtitle="Share field progress on a manifesto promise" onBack={() => router.back()} />

        {detail && (
          <Card className="mb-4">
            <Text className="text-lg font-bold text-ink">{detail.title}</Text>
            <View className="mt-2 flex-row gap-2">
              <StatusPill status={detail.workStatus} />
              <Badge label={`${detail.completionPct}%`} color={colors.gold} />
            </View>
          </Card>
        )}

        <Card className="mb-4">
          <SectionTitle className="mt-0">Select promise</SectionTitle>
          {(list?.data ?? []).map((p) => (
            <Text
              key={p.id}
              onPress={() => setSelected(p.id)}
              className={`mb-2 rounded-xl border px-3 py-2 text-sm ${selected === p.id ? 'border-navy bg-navy/5 font-semibold text-navy' : 'border-line text-muted'}`}
            >
              {p.title}
            </Text>
          ))}
          <Field label="Update note *" value={note} onChangeText={setNote} multiline placeholder="Work completed, site visit findings…" />
          <PrimaryButton
            label={submit.isPending ? 'Posting…' : 'Post update'}
            icon="send"
            onPress={selected && note ? () => submit.mutate() : undefined}
            loading={submit.isPending}
          />
        </Card>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
