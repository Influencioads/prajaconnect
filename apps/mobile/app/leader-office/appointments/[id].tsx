import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
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
import { Screen, ScreenHeader, Field, PrimaryButton, StatusPill, Card } from '../../../components/ui';
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
        <ActivityIndicator color={colors.navy} className="mt-8" />
      </Screen>
    );
  }

  if (isError || !appt) {
    return (
      <Screen>
        <ScreenHeader title="Appointment" onBack={() => router.back()} />
        <Text className="mt-4 text-center text-gray-500">Appointment not found.</Text>
        <PrimaryButton label="Retry" onPress={refetch} />
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
                <Text className="text-lg font-bold text-navy">{appt.visitorName}</Text>
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
                  <Chip label="Approve" onPress={() => setStatus('Approved')} color={colors.success} />
                  <Chip label="Reject" onPress={() => setStatus('Rejected')} color={colors.danger} />
                </>
              )}
              {appt.status === 'Approved' && (
                <Chip label="Complete" onPress={() => setStatus('Completed')} color={colors.navy} />
              )}
            </View>

            <PrimaryButton label="Edit" onPress={() => setEditing(true)} />
            <Pressable onPress={remove} className="mt-3 h-12 items-center justify-center rounded-xl border border-red-200 bg-red-50">
              <Text className="font-bold text-red-600">Delete</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Field label="Visitor name" value={form.visitorName} onChangeText={(v) => set('visitorName', v)} />
            <Field label="Mobile" value={form.mobile} onChangeText={(v) => set('mobile', v)} keyboardType="phone-pad" />
            <Field label="Purpose" value={form.purpose} onChangeText={(v) => set('purpose', v)} multiline />
            <Field label="Scheduled (YYYY-MM-DD HH:mm)" value={form.scheduledAt} onChangeText={(v) => set('scheduledAt', v)} />
            <Text className="mb-1 text-sm font-medium text-gray-700">Status</Text>
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
    <View className="border-b border-slate-100 py-2">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="text-sm font-medium text-navy">{value}</Text>
    </View>
  );
}

function Chip({
  label,
  onPress,
  color,
  active,
}: {
  label: string;
  onPress: () => void;
  color: string;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-3 py-1.5"
      style={{ backgroundColor: active !== false ? color : '#E2E8F0' }}
    >
      <Text className="text-xs font-semibold" style={{ color: active !== false ? '#fff' : colors.muted }}>
        {label}
      </Text>
    </Pressable>
  );
}
