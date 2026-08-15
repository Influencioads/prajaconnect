import * as React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCitizen, updateCitizen } from '../../lib/crm';
import { apiError } from '../../lib/api';
import { mobileError } from '../../lib/validate';
import {
  Screen,
  ScreenHeader,
  Card,
  Badge,
  Field,
  PrimaryButton,
  Loading,
  EmptyState,
  ErrorState,
  Avatar,
} from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-line py-2">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-medium text-ink">{value}</Text>
    </View>
  );
}

export default function CitizenDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');

  const { data: c, isLoading, isError, refetch } = useQuery({
    queryKey: ['m-citizen', id],
    queryFn: () => fetchCitizen(id!),
  });

  // Seed the edit fields once the citizen loads.
  React.useEffect(() => {
    if (c) {
      setName(c.name ?? '');
      setMobile(c.mobile ?? '');
    }
  }, [c]);

  const save = useMutation({
    mutationFn: () => updateCitizen(id!, { name: name.trim(), mobile: mobile.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-citizen', id] });
      qc.invalidateQueries({ queryKey: ['m-citizens'] });
      setEditing(false);
      Alert.alert('Saved', 'Citizen profile updated.');
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Citizen" subtitle="Profile & details" onBack={() => router.back()} />

        {isLoading ? (
          <Loading />
        ) : isError ? (
          <ErrorState title="Couldn’t load citizen" onRetry={refetch} />
        ) : !c ? (
          <EmptyState title="Not found" icon="person" />
        ) : (
          <>
            <Card className="mb-3">
              <View className="flex-row items-center">
                <Avatar name={c.name} size={48} />
                <View className="ml-3 flex-1 pr-2">
                  <Text className="text-lg font-bold text-ink" numberOfLines={1}>
                    {c.name}
                  </Text>
                  {c.mobile ? <Text className="mt-0.5 text-sm text-muted">{c.mobile}</Text> : null}
                </View>
                <Badge label={c.status} color={statusColor[c.status] ?? colors.navy} />
              </View>
            </Card>

            {editing ? (
              <Card className="mb-3">
                <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-faint">Edit details</Text>
                <Field label="Name *" value={name} onChangeText={setName} icon="person" />
                <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" icon="call" />
                {mobileError(mobile) ? (
                  <Text className="-mt-1 text-xs text-red-600">{mobileError(mobile)}</Text>
                ) : null}
                <View className="mt-1 flex-row gap-2">
                  <View className="flex-1">
                    <PrimaryButton
                      label={save.isPending ? 'Saving…' : 'Save'}
                      icon="checkmark-circle"
                      onPress={name.trim() && !mobileError(mobile) && !save.isPending ? () => save.mutate() : undefined}
                      loading={save.isPending}
                    />
                  </View>
                </View>
                <PrimaryButton
                  label="Cancel"
                  variant="ghost"
                  className="mt-2"
                  onPress={() => {
                    setEditing(false);
                    setName(c.name ?? '');
                    setMobile(c.mobile ?? '');
                  }}
                />
              </Card>
            ) : (
              <>
                <Card className="mb-3">
                  <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-faint">Profile</Text>
                  <Row label="Gender" value={c.gender ?? '—'} />
                  <Row label="Age" value={c.age != null ? String(c.age) : '—'} />
                  <Row label="Voter ID" value={c.voterId ?? '—'} />
                  <Row label="Occupation" value={c.occupation ?? '—'} />
                  <Row label="Mandal" value={c.mandal?.name ?? '—'} />
                  <Row label="Village" value={c.village?.name ?? '—'} />
                  {c.address ? <Row label="Address" value={c.address} /> : null}
                </Card>
                <PrimaryButton label="Edit profile" icon="construct" onPress={() => setEditing(true)} />
              </>
            )}
          </>
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
