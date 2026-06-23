import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { apiError } from '../../lib/api';
import { checkCitizenDuplicate } from '../../lib/data-quality';
import { fetchGeoOptions } from '../../lib/crm';
import { mobileError } from '../../lib/validate';
import { Screen, ScreenHeader, Card, PrimaryButton, Field, Badge } from '../../components/ui';
import { colors } from '../../lib/theme';

const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['Active', 'Inactive', 'Deceased', 'Migrated'];

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
  if (!options.length) return null;
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

export default function CitizenCreate() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    name: '',
    mobile: '',
    gender: '',
    age: '',
    voterId: '',
    occupation: '',
    category: '',
    address: '',
    status: 'Active',
    mandalId: '',
    villageId: '',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [debouncedMobile, setDebouncedMobile] = React.useState('');
  const [debouncedName, setDebouncedName] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedMobile(form.mobile), 400);
    return () => clearTimeout(t);
  }, [form.mobile]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedName(form.name), 400);
    return () => clearTimeout(t);
  }, [form.name]);

  const { data: geo } = useQuery({ queryKey: ['m-geo'], queryFn: fetchGeoOptions });
  const villages = (geo?.villages ?? []).filter((v) => !form.mandalId || v.mandalId === form.mandalId);

  const { data: dupCheck } = useQuery({
    queryKey: ['m-citizen-dup-check', debouncedMobile, debouncedName],
    queryFn: () => checkCitizenDuplicate(debouncedMobile || undefined, debouncedName || undefined),
    enabled: debouncedMobile.length >= 10 || debouncedName.length >= 3,
  });

  const ageNum = form.age.trim() ? Number(form.age) : undefined;
  const ageValid = ageNum === undefined || (Number.isInteger(ageNum) && ageNum >= 0 && ageNum <= 130);

  const create = useMutation({
    mutationFn: () =>
      api.post('/citizens', {
        name: form.name,
        mobile: form.mobile || undefined,
        gender: form.gender || undefined,
        age: ageNum,
        voterId: form.voterId || undefined,
        occupation: form.occupation || undefined,
        category: form.category || undefined,
        address: form.address || undefined,
        status: form.status || undefined,
        mandalId: form.mandalId || undefined,
        villageId: form.villageId || undefined,
      }),
    onSuccess: () => {
      // Refresh the directory list so the new citizen shows without a manual pull-to-refresh.
      qc.invalidateQueries({ queryKey: ['m-citizens'] });
      qc.invalidateQueries({ queryKey: ['m-dashboard'] });
      Alert.alert('Created', 'Citizen profile saved.', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const canSubmit =
    form.name.trim().length >= 2 && !mobileError(form.mobile) && ageValid && !dupCheck?.readOnly;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Add Citizen" subtitle="Create a new citizen profile" onBack={() => router.back()} />

        {dupCheck?.hasDuplicate && (
          <Card className="mb-4 border-amber-300 bg-amber-50">
            <View className="mb-2 flex-row items-center gap-2">
              <Badge label={dupCheck.readOnly ? 'Duplicate blocked' : 'Duplicate warning'} color="#d97706" />
            </View>
            <Text className="text-sm text-amber-900">
              {dupCheck.readOnly
                ? 'A citizen with this mobile already exists. Creation is blocked.'
                : 'Possible duplicate profiles found:'}
            </Text>
            {(dupCheck.warnings ?? []).map((w) => (
              <Text key={w.citizenId} className="mt-1 text-sm text-amber-800">
                {w.name} {w.mobile ? `· ${w.mobile}` : ''} — {w.reason} ({Math.round(w.score * 100)}%)
              </Text>
            ))}
          </Card>
        )}

        <Card className="mb-4">
          <Field label="Name *" value={form.name} onChangeText={(v) => set('name', v)} />
          <Field label="Mobile" value={form.mobile} onChangeText={(v) => set('mobile', v)} keyboardType="phone-pad" />
          {mobileError(form.mobile) ? (
            <Text className="-mt-1 mb-2 text-xs text-red-600">{mobileError(form.mobile)}</Text>
          ) : null}

          <Chips
            label="Gender"
            options={GENDERS.map((g) => ({ id: g, name: g }))}
            value={form.gender}
            onChange={(v) => set('gender', v)}
          />

          <Field label="Age" value={form.age} onChangeText={(v) => set('age', v)} keyboardType="numeric" />
          {!ageValid ? <Text className="-mt-1 mb-2 text-xs text-red-600">Age must be 0–130.</Text> : null}

          <Field label="Voter ID (EPIC)" value={form.voterId} onChangeText={(v) => set('voterId', v)} autoCapitalize="characters" />
          <Field label="Occupation" value={form.occupation} onChangeText={(v) => set('occupation', v)} />
          <Field label="Category" value={form.category} onChangeText={(v) => set('category', v)} placeholder="GEN, OBC, SC, ST…" />
          <Field label="Address" value={form.address} onChangeText={(v) => set('address', v)} multiline />
        </Card>

        <Card className="mb-4">
          <Chips label="Mandal" options={geo?.mandals ?? []} value={form.mandalId} onChange={(v) => { set('mandalId', v); set('villageId', ''); }} />
          <Chips label="Village" options={villages} value={form.villageId} onChange={(v) => set('villageId', v)} />
          <Chips
            label="Status"
            options={STATUSES.map((s) => ({ id: s, name: s }))}
            value={form.status}
            onChange={(v) => set('status', v || 'Active')}
          />
        </Card>

        <PrimaryButton
          label={create.isPending ? 'Saving…' : 'Create citizen'}
          onPress={canSubmit ? () => create.mutate() : undefined}
          loading={create.isPending}
        />
        {dupCheck?.readOnly ? (
          <Text className="mt-2 text-center text-xs text-amber-700">Resolve duplicate before creating a new profile.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
