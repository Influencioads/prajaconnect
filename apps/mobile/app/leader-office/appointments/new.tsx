import * as React from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { createAppointment, formatDatetimeLocal, toIsoDatetimeLocal } from '../../../lib/leader-office';
import { apiError } from '../../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../../components/ui';

export default function NewAppointment() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    visitorName: '',
    mobile: '',
    purpose: '',
    scheduledAt: '',
  });
  const [saving, setSaving] = React.useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.visitorName.trim().length >= 2 && form.purpose.trim().length >= 3;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const scheduledAt = toIsoDatetimeLocal(form.scheduledAt.replace(' ', 'T'));
      await createAppointment({
        visitorName: form.visitorName.trim(),
        mobile: form.mobile.trim() || undefined,
        purpose: form.purpose.trim(),
        scheduledAt,
      });
      qc.invalidateQueries({ queryKey: ['m-leader-appointments'] });
      qc.invalidateQueries({ queryKey: ['m-leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['m-leader-dash'] });
      router.back();
    } catch (err) {
      Alert.alert('Save failed', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="New appointment" onBack={() => router.back()} />
          <Field label="Visitor name" value={form.visitorName} onChangeText={(v) => set('visitorName', v)} placeholder="Full name" />
          <Field label="Mobile" value={form.mobile} onChangeText={(v) => set('mobile', v)} placeholder="Optional" keyboardType="phone-pad" />
          <Field label="Purpose" value={form.purpose} onChangeText={(v) => set('purpose', v)} placeholder="Reason for visit" multiline />
          <Field
            label="Scheduled (YYYY-MM-DD HH:mm)"
            value={form.scheduledAt}
            onChangeText={(v) => set('scheduledAt', v)}
            placeholder={formatDatetimeLocal(new Date().toISOString()) || '2026-06-23 10:00'}
          />
          <View className="mt-4">
            <PrimaryButton label={saving ? 'Saving…' : 'Create appointment'} loading={saving} onPress={submit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
