import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPollingDayUpdate, fetchElectionBooths } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function IssueReport() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [boothPlanId, setBoothPlanId] = React.useState('');
  const [issueText, setIssueText] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const { data: booths } = useQuery({ queryKey: ['m-election-booths'], queryFn: () => fetchElectionBooths() });
  const valid = !!boothPlanId && issueText.trim().length >= 5;

  const submit = async () => {
    setSaving(true);
    try {
      await createPollingDayUpdate({
        boothPlanId,
        status: 'IssueReported',
        issueText: issueText.trim(),
        notes: notes || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-election-dashboard'] });
      Alert.alert('Reported', 'Emergency issue logged. HQ will be notified.');
      router.back();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Report Issue" subtitle="Emergency polling day issue" onBack={() => router.back()} />

          {booths?.data?.length ? (
            <>
              <Text className="mb-1 text-sm font-medium text-gray-700">Booth *</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {booths.data.map((b) => {
                  const active = boothPlanId === b.id;
                  const label = `Booth ${b.booth?.number ?? '—'}${b.mandal?.name ? ` · ${b.mandal.name}` : ''}`;
                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => setBoothPlanId(b.id)}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Field label="Booth plan ID" value={boothPlanId} onChangeText={setBoothPlanId} />
          <Field
            label="Issue description *"
            value={issueText}
            onChangeText={setIssueText}
            multiline
            placeholder="Agent absent, EVM issue, crowd disturbance…"
          />
          <Field label="Additional notes" value={notes} onChangeText={setNotes} multiline />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Reporting…' : 'Report issue'} onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? <Text className="mt-2 text-center text-xs text-gray-400">Select a booth and describe the issue (min 5 chars).</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
