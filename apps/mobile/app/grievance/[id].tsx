import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGrievance,
  changeGrievanceStatus,
  addGrievanceNote,
  GRIEVANCE_STATUSES,
} from '../../lib/crm';
import { apiError } from '../../lib/api';
import {
  Screen,
  ScreenHeader,
  Card,
  StatusPill,
  Badge,
  Field,
  Loading,
  EmptyState,
  ErrorState,
  PrimaryButton,
  SectionTitle,
} from '../../components/ui';
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
        <ScreenHeader title="Grievance" subtitle="Case detail & timeline" onBack={() => router.back()} />

        {isLoading ? (
          <Loading />
        ) : isError ? (
          <ErrorState title="Couldn’t load grievance" onRetry={refetch} />
        ) : !g ? (
          <EmptyState title="Not found" icon="document-text" />
        ) : (
          <>
            <Card className="mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-faint">{g.code}</Text>
                <StatusPill status={g.status} />
              </View>
              <Text className="mt-1 text-lg font-bold text-ink">{g.title}</Text>
              <Text className="mt-1 text-sm text-muted">{g.description}</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <Badge label={`Priority: ${g.priority}`} color={statusColor[g.priority] ?? colors.muted} />
                {g.category ? <Badge label={g.category} color={colors.navy} /> : null}
                <Badge label={g.channel} color={colors.muted} />
              </View>
            </Card>

            <Card className="mb-3">
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-faint">Assignment</Text>
              <Row label="Department" value={g.department?.name ?? 'Unassigned'} />
              <Row label="Official" value={g.assignedOfficial?.name ?? 'Unassigned'} />
              <Row label="Cadre" value={g.assignedCadre?.name ?? 'Unassigned'} />
              <Row label="Mandal" value={g.mandal?.name ?? '—'} />
              <Row label="SLA due" value={formatDateTime(g.slaDueAt)} />
            </Card>

            {g.satisfactionRating ? (
              <Card className="mb-3">
                <Text className="mb-1 text-[11px] font-bold uppercase tracking-[1.5px] text-faint">Citizen feedback</Text>
                <Text className="text-base font-semibold text-ink">{'★'.repeat(g.satisfactionRating)} ({g.satisfactionRating}/5)</Text>
                {g.feedback ? <Text className="mt-1 text-sm text-muted">{g.feedback}</Text> : null}
              </Card>
            ) : null}

            <Card className="mb-3">
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-faint">Update status</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {GRIEVANCE_STATUSES.filter((s) => s !== g.status).map((s) => (
                  <Pressable
                    key={s}
                    disabled={busy}
                    onPress={() => statusMutation.mutate(s)}
                    className="rounded-full px-3 py-1.5"
                    style={{
                      backgroundColor: statusColor[s] ? `${statusColor[s]}22` : colors.border,
                      opacity: busy ? 0.5 : 1,
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: statusColor[s] ?? colors.muted }}>
                      → {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Field
                label="Note"
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (sent with status change, or on its own)…"
                multiline
              />
              <PrimaryButton
                label={noteMutation.isPending ? 'Adding…' : 'Add note'}
                icon="send"
                onPress={note.trim().length > 0 && !busy ? () => noteMutation.mutate() : undefined}
                loading={noteMutation.isPending}
              />
            </Card>

            <SectionTitle>Timeline</SectionTitle>
            {g.updates.length === 0 ? (
              <EmptyState title="No activity yet" icon="time" />
            ) : (
              g.updates.map((u) => (
                <Card key={u.id} className="mb-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-ink">{u.action}</Text>
                    <Text className="text-xs text-faint">{formatDateTime(u.createdAt)}</Text>
                  </View>
                  {u.note ? <Text className="mt-1 text-sm text-muted">{u.note}</Text> : null}
                </Card>
              ))
            )}
          </>
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-medium text-ink">{value}</Text>
    </View>
  );
}
