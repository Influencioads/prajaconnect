import * as React from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createActivity, fetchActivityOptions } from '../../lib/crm';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip, SectionTitle } from '../../components/ui';

const TYPES = [
  { label: 'Call', value: 'Call' },
  { label: 'Task', value: 'Task' },
  { label: 'Meeting', value: 'Meeting' },
  { label: 'Field Visit', value: 'FieldVisit' },
  { label: 'Door-to-Door', value: 'DoorToDoor' },
];
const PRIORITIES = ['High', 'Medium', 'Low'];

function Pills({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} label={o.label} active={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

export default function NewActivity() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    type: 'Call',
    title: '',
    description: '',
    priority: 'Medium',
    outcome: '',
    contactName: '',
    contactMobile: '',
    mandalId: '',
  });

  const { data: opts } = useQuery({ queryKey: ['m-activity-options'], queryFn: fetchActivityOptions });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim().length >= 2;

  const submit = async () => {
    setSaving(true);
    try {
      await createActivity({
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        outcome: form.outcome || undefined,
        contactName: form.contactName || undefined,
        contactMobile: form.contactMobile || undefined,
        mandalId: form.mandalId || undefined,
        status: form.type === 'Task' ? 'Planned' : 'Completed',
      });
      qc.invalidateQueries({ queryKey: ['m-activities'] });
      qc.invalidateQueries({ queryKey: ['m-activity-stats'] });
      Alert.alert('Success', 'Activity logged');
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
          <ScreenHeader title="Log activity" subtitle="Record a call, task, meeting or visit" onBack={() => router.back()} />

          <SectionTitle className="mt-0">Type</SectionTitle>
          <Pills options={TYPES} value={form.type} onChange={(v) => set('type', v)} />

          <Field label="Title *" value={form.title} onChangeText={(v) => set('title', v)} placeholder="Call with citizen, booth visit…" />
          <Field label="Notes" value={form.description} onChangeText={(v) => set('description', v)} multiline />

          <SectionTitle>Priority</SectionTitle>
          <Pills options={PRIORITIES.map((p) => ({ label: p, value: p }))} value={form.priority} onChange={(v) => set('priority', v)} />

          <Field label="Outcome" value={form.outcome} onChangeText={(v) => set('outcome', v)} placeholder="Connected, Converted…" />
          <Field label="Contact name" icon="person" value={form.contactName} onChangeText={(v) => set('contactName', v)} />
          <Field label="Contact mobile" icon="call" value={form.contactMobile} onChangeText={(v) => set('contactMobile', v)} keyboardType="phone-pad" />

          {opts?.mandals?.length ? (
            <>
              <SectionTitle>Mandal</SectionTitle>
              <Pills
                options={opts.mandals.map((m) => ({ label: m.name, value: m.id }))}
                value={form.mandalId}
                onChange={(v) => set('mandalId', form.mandalId === v ? '' : v)}
              />
            </>
          ) : null}

          <View className="mb-10 mt-2">
            <PrimaryButton icon="checkmark-circle" label={saving ? 'Saving…' : 'Save activity'} onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? <Text className="mt-2 text-center text-xs text-faint">Title is required.</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
