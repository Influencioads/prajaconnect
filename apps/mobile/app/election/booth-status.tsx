import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchElectionBooths, updateElectionBooth } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

const STRENGTHS = ['Strong', 'Swing', 'Weak'];

export default function BoothStatus() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [boothPlanId, setBoothPlanId] = React.useState('');
  const [strength, setStrength] = React.useState('Swing');
  const [readiness, setReadiness] = React.useState('');
  const [issues, setIssues] = React.useState('');
  const [campaignStatus, setCampaignStatus] = React.useState('');

  const { data: booths } = useQuery({ queryKey: ['m-election-booths'], queryFn: () => fetchElectionBooths() });
  const valid = !!boothPlanId;

  const submit = async () => {
    setSaving(true);
    try {
      await updateElectionBooth(boothPlanId, {
        strength,
        readinessScore: readiness ? Number(readiness) : undefined,
        issues: issues || undefined,
        campaignStatus: campaignStatus || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-election-dashboard'] });
      qc.invalidateQueries({ queryKey: ['m-election-booths'] });
      Alert.alert('Success', 'Booth status updated');
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
          <ScreenHeader title="Booth Status" subtitle="Update booth readiness" onBack={() => router.back()} />

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

          <Text className="mb-1 text-sm font-medium text-gray-700">Strength</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {STRENGTHS.map((s) => {
              const active = strength === s;
              return (
                <Pressable key={s} onPress={() => setStrength(s)} className="rounded-full px-3 py-1.5" style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}>
                  <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>{s}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field label="Readiness score (0–100)" value={readiness} onChangeText={setReadiness} keyboardType="numeric" />
          <Field label="Issues" value={issues} onChangeText={setIssues} multiline />
          <Field label="Campaign status" value={campaignStatus} onChangeText={setCampaignStatus} placeholder="On track, needs support…" />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Update booth'} onPress={valid ? submit : undefined} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
