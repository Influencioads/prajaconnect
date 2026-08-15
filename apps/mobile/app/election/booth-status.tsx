import * as React from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchElectionBooths, updateElectionBooth } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip } from '../../components/ui';

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
              <Text className="mb-1.5 text-[13px] font-semibold text-ink">Booth *</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {booths.data.map((b) => (
                  <Chip
                    key={b.id}
                    label={`Booth ${b.booth?.number ?? '—'}${b.mandal?.name ? ` · ${b.mandal.name}` : ''}`}
                    active={boothPlanId === b.id}
                    onPress={() => setBoothPlanId(b.id)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Field label="Booth plan ID" value={boothPlanId} onChangeText={setBoothPlanId} />

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Strength</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {STRENGTHS.map((s) => (
              <Chip key={s} label={s} active={strength === s} onPress={() => setStrength(s)} />
            ))}
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
