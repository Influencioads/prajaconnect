import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';
import { apiError } from '../../lib/api';
import { fetchGeoOptions } from '../../lib/crm';
import {
  createNetworkRecord,
  updateNetworkRecord,
  fetchNetworkDetail,
  NETWORK_VIEWS,
  type NetworkField,
} from '../../lib/network';

const COMMON: NetworkField[] = [
  { key: 'fullName', label: 'Full Name *' },
  { key: 'mobile', label: 'Mobile Number *', numeric: true },
  { key: 'whatsapp', label: 'WhatsApp Number', numeric: true },
  { key: 'email', label: 'Email' },
  { key: 'designation', label: 'Designation' },
  { key: 'age', label: 'Age', numeric: true },
  { key: 'categoryType', label: 'Category Type' },
  { key: 'politicalInfluenceLevel', label: 'Political Influence Level', options: ['High', 'Medium', 'Low'] },
  { key: 'publicReach', label: 'Public Reach', numeric: true },
  { key: 'assignedArea', label: 'Assigned Area' },
];

function Pills({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}
          >
            <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MemberForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const { view, id } = useLocalSearchParams<{ view?: string; id?: string }>();
  const viewKey = view ?? 'mandal-committee';
  const config = NETWORK_VIEWS[viewKey];
  const editing = !!id;

  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({ status: 'Active' });

  const { data: geo } = useQuery({ queryKey: ['m-geo'], queryFn: fetchGeoOptions });
  const { data: existing } = useQuery({
    queryKey: ['m-network-detail', config?.resource, id],
    queryFn: () => fetchNetworkDetail(config.resource, id as string),
    enabled: editing && !!config,
  });

  React.useEffect(() => {
    if (existing) {
      const f: Record<string, string> = { status: existing.status ?? 'Active' };
      [...COMMON, ...(config?.extraFields ?? [])].forEach((field) => {
        const v = existing[field.key];
        f[field.key] = v === null || v === undefined ? '' : String(v);
      });
      f.mandalId = existing.mandalId ?? '';
      f.notes = existing.notes ?? '';
      f.address = existing.address ?? '';
      setForm(f);
    }
  }, [existing, config]);

  if (!config) {
    return (
      <Screen>
        <ScreenHeader title="Not found" onBack={() => router.back()} />
      </Screen>
    );
  }

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));
  const valid = (form.fullName ?? '').trim().length >= 2 && (form.mobile ?? '').trim().length >= 7;

  const submit = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      [...COMMON, ...config.extraFields].forEach((field) => {
        const raw = form[field.key];
        if (raw === undefined || raw === '') return;
        payload[field.key] = field.numeric ? Number(raw) : raw;
      });
      payload.status = form.status || 'Active';
      if (form.mandalId) payload.mandalId = form.mandalId;
      if (form.address) payload.address = form.address;
      if (form.notes) payload.notes = form.notes;
      if (config.category) payload.category = config.category;

      if (editing) {
        await updateNetworkRecord(config.resource, id as string, payload);
      } else {
        await createNetworkRecord(config.resource, payload);
      }
      qc.invalidateQueries({ queryKey: ['m-network', viewKey] });
      qc.invalidateQueries({ queryKey: ['m-network-stats', viewKey] });
      if (editing) qc.invalidateQueries({ queryKey: ['m-network-detail', config.resource, id] });
      Alert.alert('Success', editing ? 'Member updated' : 'Member added');
      router.back();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: NetworkField) => {
    if (field.options) {
      return (
        <View key={field.key}>
          <Text className="mb-1 text-sm font-medium text-gray-700">{field.label}</Text>
          <Pills
            options={field.options.map((o) => ({ label: o, value: o }))}
            value={form[field.key] ?? ''}
            onChange={(v) => set(field.key, form[field.key] === v ? '' : v)}
          />
        </View>
      );
    }
    return (
      <Field
        key={field.key}
        label={field.label}
        value={form[field.key] ?? ''}
        onChangeText={(v) => set(field.key, v)}
        keyboardType={field.numeric ? 'numeric' : 'default'}
        multiline={field.multiline}
      />
    );
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={editing ? `Edit ${config.title}` : `Add to ${config.title}`}
            onBack={() => router.back()}
          />

          {COMMON.map(renderField)}

          <Text className="mb-1 text-sm font-medium text-gray-700">Status</Text>
          <Pills
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
            ]}
            value={form.status ?? 'Active'}
            onChange={(v) => set('status', v)}
          />

          {geo?.mandals?.length ? (
            <>
              <Text className="mb-1 text-sm font-medium text-gray-700">Mandal</Text>
              <Pills
                options={geo.mandals.map((m) => ({ label: m.name, value: m.id }))}
                value={form.mandalId ?? ''}
                onChange={(v) => set('mandalId', form.mandalId === v ? '' : v)}
              />
            </>
          ) : null}

          {config.extraFields.map(renderField)}

          <Field
            label="Address"
            value={form.address ?? ''}
            onChangeText={(v) => set('address', v)}
            multiline
          />
          <Field label="Notes" value={form.notes ?? ''} onChangeText={(v) => set('notes', v)} multiline />

          <View className="mb-10 mt-2">
            <PrimaryButton
              label={saving ? 'Saving…' : editing ? 'Save changes' : 'Add member'}
              onPress={valid ? submit : undefined}
              loading={saving}
            />
            {!valid ? (
              <Text className="mt-2 text-center text-xs text-gray-400">
                Full name and a valid mobile number are required.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
