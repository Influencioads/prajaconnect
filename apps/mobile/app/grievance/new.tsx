import * as React from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createGrievance, fetchGeoOptions, fetchGrievanceOptions } from '../../lib/crm';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip } from '../../components/ui';
import { statusColor } from '../../lib/theme';

const PRIORITIES = ['High', 'Medium', 'Low'];

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[13px] font-semibold text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.id;
          return <Chip key={o.id} label={o.name} active={active} onPress={() => onChange(active ? '' : o.id)} />;
        })}
      </View>
    </View>
  );
}

export default function NewGrievance() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    reportedByName: '',
    reportedByMobile: '',
    departmentId: '',
    mandalId: '',
  });
  const [saving, setSaving] = React.useState(false);

  const { data: geo } = useQuery({ queryKey: ['m-geo'], queryFn: fetchGeoOptions });
  const { data: opts } = useQuery({ queryKey: ['m-grievance-options'], queryFn: fetchGrievanceOptions });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim().length >= 4 && form.description.trim().length >= 5;

  const submit = async () => {
    setSaving(true);
    try {
      await createGrievance({
        title: form.title,
        description: form.description,
        category: form.category || undefined,
        priority: form.priority,
        channel: 'Mobile',
        reportedByName: form.reportedByName || undefined,
        reportedByMobile: form.reportedByMobile || undefined,
        departmentId: form.departmentId || undefined,
        mandalId: form.mandalId || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-grievances'] });
      qc.invalidateQueries({ queryKey: ['m-dashboard'] });
      Alert.alert('Success', 'Grievance logged successfully');
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
          <ScreenHeader title="Log grievance" subtitle="Register a citizen complaint" onBack={() => router.back()} />

          <Field label="Title *" value={form.title} onChangeText={(v) => set('title', v)} placeholder="Street light not working" icon="document-text" />
          <Field label="Description *" value={form.description} onChangeText={(v) => set('description', v)} multiline />
          <Field label="Category" value={form.category} onChangeText={(v) => set('category', v)} placeholder="Roads, Water…" icon="pricetag" />

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Priority</Text>
          <View className="mb-3 flex-row gap-2">
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p}
                active={form.priority === p}
                color={statusColor[p]}
                onPress={() => set('priority', p)}
              />
            ))}
          </View>

          {opts?.departments?.length ? (
            <Chips label="Department" options={opts.departments} value={form.departmentId} onChange={(v) => set('departmentId', v)} />
          ) : null}
          {geo?.mandals?.length ? (
            <Chips label="Mandal" options={geo.mandals} value={form.mandalId} onChange={(v) => set('mandalId', v)} />
          ) : null}

          <Field label="Reporter name" value={form.reportedByName} onChangeText={(v) => set('reportedByName', v)} icon="person" />
          <Field label="Reporter mobile" value={form.reportedByMobile} onChangeText={(v) => set('reportedByMobile', v)} keyboardType="phone-pad" icon="call" />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Log grievance'} icon="send" onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? (
              <Text className="mt-2 text-center text-xs text-faint">Title (4+) and description (5+) are required.</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
