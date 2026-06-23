import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetStatus, AssetCondition } from '@praja/types';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { fetchGeoOptions } from '../../lib/crm';
import { apiError } from '../../lib/api';
import {
  configForSlug,
  createAsset,
  updateAsset,
  fetchAsset,
} from '../../lib/assets';
import { colors } from '../../lib/theme';

const STATUSES = Object.values(AssetStatus);
const CONDITIONS = Object.values(AssetCondition);

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
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(active ? '' : o.id)}
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}
            >
              <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>
                {o.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AssetForm() {
  const { category, id } = useLocalSearchParams<{ category: string; id?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const config = configForSlug(category);
  const isEdit = !!id;

  const [common, setCommon] = React.useState({ name: '', status: 'Active', condition: '', wardNumber: '', contractor: '', address: '', description: '', mandalId: '' });
  const [extra, setExtra] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const { data: geo } = useQuery({ queryKey: ['m-geo'], queryFn: fetchGeoOptions });
  const { data: existing } = useQuery({ queryKey: ['m-asset', id], queryFn: () => fetchAsset(id as string), enabled: isEdit });

  React.useEffect(() => {
    if (!existing) return;
    setCommon({
      name: existing.name ?? '',
      status: existing.status ?? 'Active',
      condition: existing.condition ?? '',
      wardNumber: existing.wardNumber ?? '',
      contractor: existing.contractor ?? '',
      address: existing.address ?? '',
      description: existing.description ?? '',
      mandalId: existing.mandal?.id ?? '',
    });
    const e: Record<string, string> = {};
    for (const f of config.fields) {
      const raw = f.store === 'detail' && f.detailKey
        ? (existing as unknown as Record<string, Record<string, unknown> | null>)[f.detailKey]?.[f.key]
        : (existing.attributes ?? {})[f.key];
      if (raw != null) e[f.key] = f.type === 'boolean' ? (raw ? 'true' : 'false') : String(raw);
    }
    setExtra(e);
  }, [existing]);

  const setC = (k: keyof typeof common, v: string) => setCommon((f) => ({ ...f, [k]: v }));
  const setE = (k: string, v: string) => setExtra((f) => ({ ...f, [k]: v }));
  const valid = common.name.trim().length >= 2;

  const submit = async () => {
    setSaving(true);
    try {
      const detail: Record<string, Record<string, unknown>> = {};
      const attributes: Record<string, unknown> = {};
      for (const f of config.fields) {
        const raw = extra[f.key];
        if (raw === undefined || raw === '') continue;
        let value: unknown = raw;
        if (f.type === 'number') value = Number(raw);
        else if (f.type === 'boolean') value = raw === 'true';
        if (f.store === 'detail' && f.detailKey) {
          detail[f.detailKey] = detail[f.detailKey] ?? {};
          detail[f.detailKey][f.key] = value;
        } else attributes[f.key] = value;
      }
      const payload: Record<string, unknown> = {
        category: config.category,
        name: common.name,
        status: common.status,
        condition: config.showCondition && common.condition ? common.condition : undefined,
        wardNumber: common.wardNumber || undefined,
        contractor: common.contractor || undefined,
        address: common.address || undefined,
        description: common.description || undefined,
        mandalId: common.mandalId || undefined,
        ...detail,
      };
      if (Object.keys(attributes).length) payload.attributes = attributes;
      if (isEdit) await updateAsset(id as string, payload);
      else await createAsset(payload);
      qc.invalidateQueries({ queryKey: ['m-assets'] });
      qc.invalidateQueries({ queryKey: ['m-asset-stats'] });
      if (isEdit) qc.invalidateQueries({ queryKey: ['m-asset', id] });
      Alert.alert('Success', `${config.singular} saved`);
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
          <ScreenHeader title={isEdit ? `Edit ${config.singular}` : `New ${config.singular}`} onBack={() => router.back()} />

          <Field label="Name *" value={common.name} onChangeText={(v) => setC('name', v)} />

          <Text className="mb-1 text-sm font-medium text-gray-700">Status</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Pressable key={s} onPress={() => setC('status', s)} className="rounded-full px-3 py-1.5" style={{ backgroundColor: common.status === s ? colors.navy : '#E2E8F0' }}>
                <Text className="text-xs font-semibold" style={{ color: common.status === s ? '#fff' : colors.muted }}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {config.showCondition ? (
            <View className="mb-3">
              <Text className="mb-1 text-sm font-medium text-gray-700">Condition</Text>
              <View className="flex-row flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Pressable key={c} onPress={() => setC('condition', common.condition === c ? '' : c)} className="rounded-full px-3 py-1.5" style={{ backgroundColor: common.condition === c ? colors.navy : '#E2E8F0' }}>
                    <Text className="text-xs font-semibold" style={{ color: common.condition === c ? '#fff' : colors.muted }}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {config.fields.map((f) => {
            if (f.type === 'select' && f.options) {
              return (
                <View key={f.key} className="mb-3">
                  <Text className="mb-1 text-sm font-medium text-gray-700">{f.label}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {f.options.map((o) => (
                      <Pressable key={o} onPress={() => setE(f.key, extra[f.key] === o ? '' : o)} className="rounded-full px-3 py-1.5" style={{ backgroundColor: extra[f.key] === o ? colors.navy : '#E2E8F0' }}>
                        <Text className="text-xs font-semibold" style={{ color: extra[f.key] === o ? '#fff' : colors.muted }}>{o}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            }
            if (f.type === 'boolean') {
              return (
                <View key={f.key} className="mb-3">
                  <Text className="mb-1 text-sm font-medium text-gray-700">{f.label}</Text>
                  <View className="flex-row gap-2">
                    {['true', 'false'].map((b) => (
                      <Pressable key={b} onPress={() => setE(f.key, b)} className="rounded-full px-4 py-1.5" style={{ backgroundColor: (extra[f.key] || 'false') === b ? colors.navy : '#E2E8F0' }}>
                        <Text className="text-xs font-semibold" style={{ color: (extra[f.key] || 'false') === b ? '#fff' : colors.muted }}>{b === 'true' ? 'Yes' : 'No'}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            }
            return (
              <Field
                key={f.key}
                label={f.label}
                value={extra[f.key] ?? ''}
                onChangeText={(v) => setE(f.key, v)}
                keyboardType={f.type === 'number' ? 'numeric' : 'default'}
              />
            );
          })}

          {geo?.mandals?.length ? (
            <Chips label="Mandal" options={geo.mandals} value={common.mandalId} onChange={(v) => setC('mandalId', v)} />
          ) : null}

          <Field label="Ward No." value={common.wardNumber} onChangeText={(v) => setC('wardNumber', v)} />
          <Field label="Contractor" value={common.contractor} onChangeText={(v) => setC('contractor', v)} />
          <Field label="Address" value={common.address} onChangeText={(v) => setC('address', v)} />
          <Field label="Notes" value={common.description} onChangeText={(v) => setC('description', v)} multiline />

          <View className="mb-12 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : `Save ${config.singular}`} onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? <Text className="mt-2 text-center text-xs text-gray-400">Name is required.</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
