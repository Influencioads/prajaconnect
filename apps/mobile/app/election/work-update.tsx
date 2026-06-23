import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchElectionWork, updateElectionWork } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Loading } from '../../components/ui';
import { colors } from '../../lib/theme';

const STATUSES = ['NotStarted', 'InProgress', 'Completed', 'Delayed', 'Cancelled'];

function Pills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable key={o} onPress={() => onChange(o)} className="rounded-full px-3 py-1.5" style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}>
            <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function WorkUpdate() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState('InProgress');
  const [notes, setNotes] = React.useState('');
  const [proofUrl, setProofUrl] = React.useState('');

  const { data: work, isLoading } = useQuery({
    queryKey: ['m-election-work', id],
    queryFn: () => fetchElectionWork(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (work?.status) setStatus(work.status);
    if (work?.proofUrl) setProofUrl(work.proofUrl);
    if (work?.description) setNotes(work.description);
  }, [work]);

  const submit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateElectionWork(id, {
        status,
        description: notes || undefined,
        proofUrl: proofUrl || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-election-works'] });
      qc.invalidateQueries({ queryKey: ['m-election-tasks'] });
      qc.invalidateQueries({ queryKey: ['m-election-dashboard'] });
      Alert.alert('Success', 'Work updated');
      router.back();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !work) {
    return (
      <Screen>
        <ScreenHeader title="Update Work" onBack={() => router.back()} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title={work.title} subtitle={`${work.type} · ${work.priority}`} onBack={() => router.back()} />

          <Text className="mb-1 text-sm font-medium text-gray-700">Status</Text>
          <Pills options={STATUSES} value={status} onChange={setStatus} />

          <Field label="Notes / progress" value={notes} onChangeText={setNotes} multiline placeholder="What was completed?" />
          <Field label="Proof URL" value={proofUrl} onChangeText={setProofUrl} placeholder="Photo or document URL" />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Update work'} onPress={submit} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
