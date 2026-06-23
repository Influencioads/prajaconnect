import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGrievance,
  changeGrievanceStatus,
  addGrievanceNote,
  GRIEVANCE_STATUSES,
} from '../../lib/crm';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, StatusPill, Badge, Loading, EmptyState, ErrorState, PrimaryButton } from '../../components/ui';
import { colors, statusColor } from '../../lib/theme';

function formatDateTime(d?: string | null) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function GrievanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [note, setNote] = React.useState('');
  const { data: g, isLoading, isError, refetch } = useQuery({
    queryKey: ['m-grievance', id],
    queryFn: () => fetchGrievance(id),
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['m-grievance', id] });
    qc.invalidateQueries({ queryKey: ['m-grievances'] });
    qc.invalidateQueries({ queryKey: ['m-dashboard'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => changeGrievanceStatus(id, status, note.trim() || undefined),
    onSuccess: () => {
      setNote('');
      refreshAll();
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const noteMutation = useMutation({
    mutationFn: () => addGrievanceNote(id, note.trim()),
    onSuccess: () => {
      setNote('');
      refreshAll();
    },
    onError: (e) => Alert.alert('Failed', apiError(e)),
  });

  const busy = statusMutation.isPending || noteMutation.isPending;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Grievance" onBack={() => router.back()} />

        {isLoading ? (
          <Loading />
        ) : isError ? (
          <ErrorState title="Couldn’t load grievance" onRetry={refetch} />
        ) : !g ? (
          <EmptyState title="Not found" />
        ) : (
          <>
            <Card className="mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-gray-400">{g.code}</Text>
                <StatusPill status={g.status} />
              </View>
              <Text className="mt-1 text-lg font-bold text-navy">{g.title}</Text>
              <Text className="mt-1 text-sm text-gray-600">{g.description}</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <Badge label={`Priority: ${g.priority}`} color={statusColor[g.priority] ?? colors.muted} />
                {g.category ? <Badge label={g.category} color={colors.navy} /> : null}
                <Badge label={g.channel} color={colors.muted} />
              </View>
            </Card>

            <Card className="mb-3">
              <Text className="mb-2 text-sm font-bold text-gray-500">Assignment</Text>
              <Row label="Department" value={g.department?.name ?? 'Unassigned'} />
              <Row label="Official" value={g.assignedOfficial?.name ?? 'Unassigned'} />
              <Row label="Cadre" value={g.assignedCadre?.name ?? 'Unassigned'} />
              <Row label="Mandal" value={g.mandal?.name ?? '—'} />
              <Row label="SLA due" value={formatDateTime(g.slaDueAt)} />
            </Card>

            {g.satisfactionRating ? (
              <Card className="mb-3">
                <Text className="mb-1 text-sm font-bold text-gray-500">Citizen feedback</Text>
                <Text className="text-base font-semibold text-navy">{'★'.repeat(g.satisfactionRating)} ({g.satisfactionRating}/5)</Text>
                {g.feedback ? <Text className="mt-1 text-sm text-gray-600">{g.feedback}</Text> : null}
              </Card>
            ) : null}

            <Card className="mb-3">
              <Text className="mb-2 text-sm font-bold text-gray-500">Update status</Text>
              <View className="flex-row flex-wrap gap-2">
                {GRIEVANCE_STATUSES.filter((s) => s !== g.status).map((s) => (
                  <Pressable
                    key={s}
                    disabled={busy}
                    onPress={() => statusMutation.mutate(s)}
                    className="rounded-full px-3 py-1.5"
                    style={{ backgroundColor: statusColor[s] ? `${statusColor[s]}22` : '#E2E8F0', opacity: busy ? 0.5 : 1 }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: statusColor[s] ?? colors.muted }}>
                      → {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mb-1 mt-3 text-sm font-medium text-gray-700">Note</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (sent with status change, or on its own)…"
                multiline
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-base"
                style={{ minHeight: 72, textAlignVertical: 'top' }}
              />
              <View className="mt-3">
                <PrimaryButton
                  label={noteMutation.isPending ? 'Adding…' : 'Add note'}
                  onPress={note.trim().length > 0 && !busy ? () => noteMutation.mutate() : undefined}
                  loading={noteMutation.isPending}
                />
              </View>
            </Card>

            <Text className="mb-2 text-sm font-bold text-gray-500">Timeline</Text>
            {g.updates.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              g.updates.map((u) => (
                <Card key={u.id} className="mb-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-navy">{u.action}</Text>
                    <Text className="text-xs text-gray-400">{formatDateTime(u.createdAt)}</Text>
                  </View>
                  {u.note ? <Text className="mt-1 text-sm text-gray-600">{u.note}</Text> : null}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-navy">{value}</Text>
    </View>
  );
}
