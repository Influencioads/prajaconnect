import * as React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivity, completeActivity, updateActivity, addActivityNote } from '../../lib/crm';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, StatusPill, Badge, Loading, PrimaryButton, Field } from '../../components/ui';
import { colors } from '../../lib/theme';

function fmt(d?: string | null) {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtDuration(sec?: number | null) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  return m ? `${m}m ${sec % 60}s` : `${sec}s`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-gray-100 py-2">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-navy">{value}</Text>
    </View>
  );
}

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [note, setNote] = React.useState('');
  const { data: a, isLoading } = useQuery({ queryKey: ['m-activity', id], queryFn: () => fetchActivity(id!) });

  React.useEffect(() => {
    if (a) {
      setTitle(a.title ?? '');
      setDescription(a.description ?? '');
    }
  }, [a]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['m-activity', id] });
    qc.invalidateQueries({ queryKey: ['m-activities'] });
  };

  const complete = useMutation({
    mutationFn: () => completeActivity(id!),
    onSuccess: () => {
      refresh();
      Alert.alert('Done', 'Activity marked complete');
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const save = useMutation({
    mutationFn: () => updateActivity(id!, { type: a!.type, title: title.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      refresh();
      setEditing(false);
      Alert.alert('Saved', 'Activity updated');
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const noteMutation = useMutation({
    mutationFn: () => addActivityNote(id!, note.trim()),
    onSuccess: () => {
      setNote('');
      refresh();
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  if (isLoading || !a) {
    return (
      <Screen>
        <ScreenHeader title="Activity" onBack={() => router.back()} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title={a.title} subtitle={`${a.type}${a.code ? ` · ${a.code}` : ''}`} onBack={() => router.back()} />

        <View className="mb-3 flex-row gap-2">
          <StatusPill status={a.status} />
          <Badge label={a.priority} color={colors.warning} />
          {a.direction ? <Badge label={a.direction} color={colors.navy} /> : null}
        </View>

        {editing ? (
          <Card className="mb-3">
            <Text className="mb-2 text-sm font-bold text-gray-500">Edit activity</Text>
            <Field label="Title *" value={title} onChangeText={setTitle} />
            <Field label="Description" value={description} onChangeText={setDescription} multiline />
            <PrimaryButton
              label={save.isPending ? 'Saving…' : 'Save changes'}
              onPress={title.trim() && !save.isPending ? () => save.mutate() : undefined}
              loading={save.isPending}
            />
            <Text
              onPress={() => {
                setEditing(false);
                setTitle(a.title ?? '');
                setDescription(a.description ?? '');
              }}
              className="mt-3 text-center text-sm font-semibold text-gray-500"
            >
              Cancel
            </Text>
          </Card>
        ) : (
          <>
            {a.description ? (
              <Card className="mb-3">
                <Text className="text-sm text-gray-700">{a.description}</Text>
              </Card>
            ) : null}
            <View className="mb-3 self-start">
              <Text onPress={() => setEditing(true)} className="text-sm font-semibold text-navy">
                ✎ Edit activity
              </Text>
            </View>
          </>
        )}

        <Card className="mb-3">
          <Row label="Scheduled" value={fmt(a.scheduledAt)} />
          <Row label="Due" value={fmt(a.dueAt)} />
          <Row label="Completed" value={fmt(a.completedAt)} />
          <Row label="Duration" value={fmtDuration(a.durationSec)} />
          <Row label="Outcome" value={a.outcome ?? '—'} />
          <Row label="Assigned" value={a.assignedToUser?.name ?? '—'} />
          <Row label="Contact" value={a.citizen?.name ?? a.contactName ?? a.contactMobile ?? '—'} />
          <Row label="Location" value={a.locationName ?? a.mandal?.name ?? '—'} />
        </Card>

        {a.participants.length ? (
          <Card className="mb-3">
            <Text className="mb-2 text-sm font-bold text-navy">Participants ({a.participants.length})</Text>
            {a.participants.map((p) => (
              <View key={p.id} className="flex-row justify-between py-1">
                <Text className="text-sm text-gray-700">{p.cadre?.name ?? p.citizen?.name ?? p.name ?? '—'}</Text>
                <Text className="text-xs text-gray-400">{p.status}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {a.notes.length ? (
          <Card className="mb-3">
            <Text className="mb-2 text-sm font-bold text-navy">Notes & history</Text>
            {a.notes.map((n) => (
              <View key={n.id} className="border-b border-gray-100 py-2">
                <Text className="text-xs font-semibold text-navy">{n.action}{n.toStatus ? ` → ${n.toStatus}` : ''}</Text>
                {n.note ? <Text className="mt-0.5 text-sm text-gray-600">{n.note}</Text> : null}
                <Text className="mt-0.5 text-[11px] text-gray-400">{fmt(n.createdAt)}{n.byName ? ` · ${n.byName}` : ''}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card className="mb-3">
          <Text className="mb-1 text-sm font-bold text-gray-500">Add note</Text>
          <Field label="" value={note} onChangeText={setNote} placeholder="Log an update…" multiline />
          <PrimaryButton
            label={noteMutation.isPending ? 'Adding…' : 'Add note'}
            onPress={note.trim() && !noteMutation.isPending ? () => noteMutation.mutate() : undefined}
            loading={noteMutation.isPending}
          />
        </Card>

        {a.status !== 'Completed' ? (
          <View className="mb-10 mt-1">
            <PrimaryButton label={complete.isPending ? 'Saving…' : 'Mark complete'} onPress={() => complete.mutate()} loading={complete.isPending} />
          </View>
        ) : (
          <View className="mb-10" />
        )}
      </ScrollView>
    </Screen>
  );
}
