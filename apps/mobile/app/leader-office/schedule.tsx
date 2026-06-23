import * as React from 'react';
import { ScrollView, Text, View, Pressable, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LeaderScheduleBlock } from '@praja/types';
import {
  createScheduleBlock,
  deleteScheduleBlock,
  fetchLeaderOfficeDashboard,
  fetchLeaderSchedule,
  formatDatetimeLocal,
  toIsoDatetimeLocal,
  updateScheduleBlock,
} from '../../lib/leader-office';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Card, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function LeaderSchedule() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<LeaderScheduleBlock | null>(null);
  const [form, setForm] = React.useState({ title: '', startAt: '', endAt: '' });
  const [saving, setSaving] = React.useState(false);

  const { data: dash } = useQuery({ queryKey: ['m-leader-dash'], queryFn: fetchLeaderOfficeDashboard });
  const { data: schedule, refetch } = useQuery({ queryKey: ['m-leader-schedule'], queryFn: () => fetchLeaderSchedule() });

  const openCreate = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setEditing(null);
    setForm({
      title: '',
      startAt: formatDatetimeLocal(now.toISOString()),
      endAt: formatDatetimeLocal(end.toISOString()),
    });
    setShowForm(true);
  };

  const openEdit = (block: LeaderScheduleBlock) => {
    setEditing(block);
    setForm({
      title: block.title,
      startAt: formatDatetimeLocal(block.startAt),
      endAt: formatDatetimeLocal(block.endAt),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (form.title.trim().length < 2) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        startAt: toIsoDatetimeLocal(form.startAt.replace(' ', 'T'))!,
        endAt: toIsoDatetimeLocal(form.endAt.replace(' ', 'T'))!,
      };
      if (editing) {
        await updateScheduleBlock(editing.id, payload);
      } else {
        await createScheduleBlock(payload);
      }
      qc.invalidateQueries({ queryKey: ['m-leader-schedule'] });
      qc.invalidateQueries({ queryKey: ['m-leader-calendar'] });
      qc.invalidateQueries({ queryKey: ['m-leader-dash'] });
      setShowForm(false);
      refetch();
    } catch (err) {
      Alert.alert('Save failed', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = (block: LeaderScheduleBlock) => {
    Alert.alert('Delete block', `Remove "${block.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteScheduleBlock(block.id);
            qc.invalidateQueries({ queryKey: ['m-leader-schedule'] });
            qc.invalidateQueries({ queryKey: ['m-leader-calendar'] });
            refetch();
          } catch (err) {
            Alert.alert('Delete failed', apiError(err));
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Schedule blocks" subtitle="Office schedule management" onBack={() => router.back()} />
        <View className="mb-4 flex-row flex-wrap gap-2">
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Today appts</Text>
            <Text className="text-xl font-bold" style={{ color: colors.navy }}>{dash?.todayAppointments ?? 0}</Text>
          </Card>
          <Card className="w-[47%]">
            <Text className="text-xs text-slate-500">Active visitors</Text>
            <Text className="text-xl font-bold" style={{ color: colors.navy }}>{dash?.activeVisitors ?? 0}</Text>
          </Card>
        </View>

        {!showForm ? (
          <>
            <PrimaryButton label="Add schedule block" onPress={openCreate} />
            <Text className="mb-2 mt-4 text-sm font-semibold text-navy">Blocks</Text>
            {(schedule ?? []).map((block) => (
              <Pressable key={block.id} onPress={() => openEdit(block)} onLongPress={() => remove(block)}>
                <Card className="mb-2">
                  <Text className="font-semibold text-navy">{block.title}</Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {new Date(block.startAt).toLocaleString()} – {new Date(block.endAt).toLocaleTimeString()}
                  </Text>
                </Card>
              </Pressable>
            ))}
            {!schedule?.length ? <Text className="text-sm text-gray-400">No schedule blocks.</Text> : null}
          </>
        ) : (
          <View className="mt-2">
            <Text className="mb-1 text-sm font-medium text-gray-700">Title</Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              className="mb-3 h-12 rounded-xl border border-gray-200 bg-white px-3"
            />
            <Text className="mb-1 text-sm font-medium text-gray-700">Start (YYYY-MM-DD HH:mm)</Text>
            <TextInput
              value={form.startAt}
              onChangeText={(v) => setForm((f) => ({ ...f, startAt: v }))}
              className="mb-3 h-12 rounded-xl border border-gray-200 bg-white px-3"
            />
            <Text className="mb-1 text-sm font-medium text-gray-700">End (YYYY-MM-DD HH:mm)</Text>
            <TextInput
              value={form.endAt}
              onChangeText={(v) => setForm((f) => ({ ...f, endAt: v }))}
              className="mb-3 h-12 rounded-xl border border-gray-200 bg-white px-3"
            />
            <PrimaryButton label={saving ? 'Saving…' : editing ? 'Update block' : 'Create block'} loading={saving} onPress={save} />
            <Pressable onPress={() => setShowForm(false)} className="mt-3 items-center py-2">
              <Text className="text-sm text-gray-500">Cancel</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
