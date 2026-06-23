import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  ScreenHeader,
  Card,
  StatusPill,
  Loading,
  EmptyState,
  Field,
  PrimaryButton,
} from '../../components/ui';
import { apiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { canEditNetwork, canFullDelete } from '../../components/network-list';
import {
  fetchNetworkDetail,
  deleteNetworkRecord,
  addNetworkActivity,
  NETWORK_VIEWS,
} from '../../lib/network';

export default function MemberProfile() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  const viewKey = view ?? 'mandal-committee';
  const config = NETWORK_VIEWS[viewKey];
  const resource = config?.resource ?? 'committee-members';

  const canEdit = canEditNetwork(user?.permissions);
  const canDelete = canFullDelete(user?.permissions);

  const [action, setAction] = React.useState('');
  const [note, setNote] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['m-network-detail', resource, id],
    queryFn: () => fetchNetworkDetail(resource, id),
    enabled: !!id,
  });

  const logActivity = useMutation({
    mutationFn: () => addNetworkActivity(resource, id, { action, note: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-network-detail', resource, id] });
      setAction('');
      setNote('');
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const del = useMutation({
    mutationFn: () => deleteNetworkRecord(resource, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-network', viewKey] });
      router.back();
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const confirmDelete = () => {
    Alert.alert('Remove member', `Remove ${data?.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => del.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Member" onBack={() => router.back()} />
        <Loading />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <ScreenHeader title="Member" onBack={() => router.back()} />
        <EmptyState title="Not found" />
      </Screen>
    );
  }

  const rows: [string, unknown][] = [
    ['Mobile', data.mobile],
    ['WhatsApp', data.whatsapp],
    ['Email', data.email],
    ['Designation', data.designation],
    ['Mandal', data.mandal?.name],
    ['Village', data.village?.name],
    ['Assigned Area', data.assignedArea],
    ['Public Reach', data.publicReach],
    ['Influence', data.politicalInfluenceLevel],
    ...config.extraFields.map((f) => [f.label, data[f.key]] as [string, unknown]),
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title={data.fullName} subtitle={config.title} onBack={() => router.back()} />

        <Card className="mb-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-navy">{data.fullName}</Text>
            <StatusPill status={data.status} />
          </View>
          {rows
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([label, v]) => (
              <View key={label} className="flex-row justify-between border-b border-gray-100 py-1.5">
                <Text className="text-sm text-gray-500">{label}</Text>
                <Text className="ml-3 flex-1 text-right text-sm font-medium text-navy">{String(v)}</Text>
              </View>
            ))}
          {data.notes ? (
            <View className="mt-2">
              <Text className="text-sm text-gray-500">Notes</Text>
              <Text className="mt-0.5 text-sm text-navy">{data.notes}</Text>
            </View>
          ) : null}
        </Card>

        {canEdit || canDelete ? (
          <View className="mb-4 flex-row gap-3">
            {canEdit ? (
              <Pressable
                onPress={() => router.push(`/committees/form?view=${viewKey}&id=${id}`)}
                className="h-11 flex-1 items-center justify-center rounded-xl bg-navy active:opacity-90"
              >
                <Text className="font-bold text-white">Edit</Text>
              </Pressable>
            ) : null}
            {canDelete ? (
              <Pressable
                onPress={confirmDelete}
                className="h-11 flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 active:opacity-80"
              >
                <Text className="font-bold text-red-600">Delete</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Card className="mb-4">
          <Text className="mb-2 text-base font-bold text-navy">Activity Timeline</Text>
          {canEdit ? (
            <View className="mb-3">
              <Field label="Action" value={action} onChangeText={setAction} placeholder="Called, Met…" />
              <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional note" />
              <PrimaryButton
                label={logActivity.isPending ? 'Logging…' : 'Log activity'}
                loading={logActivity.isPending}
                onPress={action.trim().length >= 2 ? () => logActivity.mutate() : undefined}
              />
            </View>
          ) : null}
          {!data.activity?.length ? (
            <Text className="py-3 text-center text-sm text-gray-400">No activity yet.</Text>
          ) : (
            data.activity.map((a) => (
              <View key={a.id} className="border-b border-gray-100 py-2">
                <Text className="text-sm font-semibold text-navy">{a.action}</Text>
                {a.note ? <Text className="text-sm text-gray-600">{a.note}</Text> : null}
                <Text className="text-xs text-gray-400">
                  {a.byName ? `${a.byName} · ` : ''}
                  {new Date(a.createdAt).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </Card>
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
