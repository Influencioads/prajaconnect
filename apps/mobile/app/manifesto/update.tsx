import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, Alert, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchPromises, fetchPromise, createPublicUpdate } from '../../lib/manifesto';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, Field, PrimaryButton, Badge } from '../../components/ui';
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
            <Text className="text-lg font-bold text-navy">{detail.title}</Text>
            <View className="mt-2 flex-row gap-2">
              <Badge label={detail.workStatus} color={colors.navy} />
              <Badge label={`${detail.completionPct}%`} color={colors.gold} />
            </View>
          </Card>
        )}

        <Card className="mb-4">
          <Text className="mb-2 text-sm font-medium text-gray-700">Select promise</Text>
          {(list?.data ?? []).map((p) => (
            <Text
              key={p.id}
              onPress={() => setSelected(p.id)}
              className={`mb-2 rounded-xl border px-3 py-2 text-sm ${selected === p.id ? 'border-navy bg-navy/5 font-semibold text-navy' : 'border-gray-200 text-gray-700'}`}
            >
              {p.title}
            </Text>
          ))}
          <Field label="Update note *" value={note} onChangeText={setNote} multiline placeholder="Work completed, site visit findings…" />
          <PrimaryButton
            label={submit.isPending ? 'Posting…' : 'Post update'}
            onPress={selected && note ? () => submit.mutate() : undefined}
            loading={submit.isPending}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
