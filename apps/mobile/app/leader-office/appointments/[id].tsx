import * as React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppointmentStatus } from '@praja/types';
import {
  deleteAppointment,
  fetchLeaderAppointment,
  updateAppointment,
  formatDatetimeLocal,
  toIsoDatetimeLocal,
} from '../../../lib/leader-office';
import { apiError } from '../../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, StatusPill, Card, Chip, Loading, ErrorState } from '../../../components/ui';
import { colors } from '../../../lib/theme';

const STATUSES: AppointmentStatus[] = ['Pending', 'Approved', 'Rejected', 'Completed'];

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    visitorName: '',
    mobile: '',
    purpose: '',
    scheduledAt: '',
    status: 'Pending' as AppointmentStatus,
  });

  const { data: appt, isLoading, isError, refetch } = useQuery({
    queryKey: ['m-leader-appointment', id],
    queryFn: () => fetchLeaderAppointment(id!),
    enabled: Boolean(id),
  });

  React.useEffect(() => {
    if (appt) {
      setForm({
        visitorName: appt.visitorName,
        mobile: appt.mobile ?? '',
        purpose: appt.purpose,
        scheduledAt: formatDatetimeLocal(appt.scheduledAt),
        status: appt.status,
      });
    }
  }, [appt]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['m-leader-appointment', id] });
    qc.invalidateQueries({ queryKey: ['m-leader-appointments'] });
    qc.invalidateQueries({ queryKey: ['m-leader-calendar'] });
    qc.invalidateQueries({ queryKey: ['m-leader-dash'] });
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateAppointment(id!, {
        visitorName: form.visitorName.trim(),
        mobile: form.mobile.trim() || undefined,
        purpose: form.purpose.trim(),
        status: form.status,
        scheduledAt: toIsoDatetimeLocal(form.scheduledAt.replace(' ', 'T')),
      });
      invalidate();
      setEditing(false);
    } catch (err) {
      Alert.alert('Save failed', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: AppointmentStatus) => {
    try {
      await updateAppointment(id!, { status });
      invalidate();
    } catch (err) {
      Alert.alert('Update failed', apiError(err));
    }
  };

  const remove = () => {
    Alert.alert('Delete appointment', `Remove appointment for ${appt?.visitorName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointment(id!);
            qc.invalidateQueries({ queryKey: ['m-leader-appointments'] });
            qc.invalidateQueries({ queryKey: ['m-leader-calendar'] });
            router.back();
          } catch (err) {
            Alert.alert('Delete failed', apiError(err));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Appointment" onBack={() => router.back()} />
        <Loading label="Loading appointment…" />
      </Screen>
    );
  }

  if (isError || !appt) {
    return (
      <Screen>
        <ScreenHeader title="Appointment" onBack={() => router.back()} />
        <ErrorState title="Appointment not found" onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={editing ? 'Edit appointment' : appt.visitorName}
          subtitle={editing ? undefined : appt.purpose}
          onBack={() => (editing ? setEditing(false) : router.back())}
        />

        {!editing ? (
          <>
            <Card className="mb-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-ink">{appt.visitorName}</Text>
                <StatusPill status={appt.status} />
              </View>
              <Row label="Mobile" value={appt.mobile ?? '—'} />
              <Row label="Purpose" value={appt.purpose} />
              <Row
                label="Scheduled"
                value={appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleString() : 'Not scheduled'}
              />
              <Row label="Requested" value={new Date(appt.createdAt).toLocaleDateString()} />
            </Card>

            <View className="mb-3 flex-row flex-wrap gap-2">
              {appt.status === 'Pending' && (
                <>
                  <Chip label="Approve" active onPress={() => setStatus('Approved')} color={colors.success} />
                  <Chip label="Reject" active onPress={() => setStatus('Rejected')} color={colors.danger} />
                </>
              )}
              {appt.status === 'Approved' && (
                <Chip label="Complete" active onPress={() => setStatus('Completed')} color={colors.navy} />
              )}
            </View>

            <PrimaryButton label="Edit" icon="create-outline" onPress={() => setEditing(true)} />
            <PrimaryButton label="Delete" icon="trash-outline" variant="danger" onPress={remove} className="mt-3" />
          </>
        ) : (
          <>
            <Field label="Visitor name" value={form.visitorName} onChangeText={(v) => set('visitorName', v)} icon="person" />
            <Field label="Mobile" value={form.mobile} onChangeText={(v) => set('mobile', v)} keyboardType="phone-pad" icon="call" />
            <Field label="Purpose" value={form.purpose} onChangeText={(v) => set('purpose', v)} multiline icon="document-text" />
            <Field label="Scheduled (YYYY-MM-DD HH:mm)" value={form.scheduledAt} onChangeText={(v) => set('scheduledAt', v)} icon="calendar" />
            <Text className="mb-1.5 text-[13px] font-semibold text-ink">Status</Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={form.status === s}
                  onPress={() => set('status', s)}
                  color={colors.navy}
                />
              ))}
            </View>
            <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} loading={saving} onPress={save} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="border-b border-line py-2">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-sm font-medium text-ink">{value}</Text>
    </View>
  );
}
