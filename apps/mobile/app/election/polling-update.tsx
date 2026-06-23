import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPollingDayUpdate, fetchElectionBooths } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

const STATUSES = [
  'BoothOpened',
  'AgentReached',
  'VotingStarted',
  'LowTurnoutAlert',
  'PollingClosed',
  'FinalReportSubmitted',
];

export default function PollingUpdate() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [boothPlanId, setBoothPlanId] = React.useState('');
  const [status, setStatus] = React.useState('VotingStarted');
  const [turnoutCount, setTurnoutCount] = React.useState('');
  const [hour, setHour] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const { data: booths } = useQuery({ queryKey: ['m-election-booths'], queryFn: () => fetchElectionBooths() });
  const valid = !!boothPlanId && !!status;

  const submit = async () => {
    setSaving(true);
    try {
      await createPollingDayUpdate({
        boothPlanId,
        status,
        turnoutCount: turnoutCount ? Number(turnoutCount) : undefined,
        hour: hour ? Number(hour) : undefined,
        notes: notes || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-election-dashboard'] });
      Alert.alert('Success', 'Polling update submitted');
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
          <ScreenHeader title="Polling Update" subtitle="Polling day booth update" onBack={() => router.back()} />

          {booths?.data?.length ? (
            <>
              <Text className="mb-1 text-sm font-medium text-gray-700">Booth *</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {booths.data.map((b) => {
                  const active = boothPlanId === b.id;
                  const label = `Booth ${b.booth?.number ?? '—'}`;
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

          <Text className="mb-1 text-sm font-medium text-gray-700">Status *</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = status === s;
              return (
                <Pressable key={s} onPress={() => setStatus(s)} className="rounded-full px-3 py-1.5" style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}>
                  <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>{s}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field label="Turnout count" value={turnoutCount} onChangeText={setTurnoutCount} keyboardType="numeric" />
          <Field label="Hour (0–23)" value={hour} onChangeText={setHour} keyboardType="numeric" />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Submit update'} onPress={valid ? submit : undefined} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
