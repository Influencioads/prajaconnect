import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { createVoterOutreach } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip } from '../../components/ui';
import { colors } from '../../lib/theme';

const CHANNELS = ['DoorToDoor', 'Call', 'WhatsApp', 'SMS', 'PublicMeeting', 'Other'];
const STANCES = ['Supporter', 'Neutral', 'Opponent', 'Unknown'];

export default function OutreachNew() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    contactName: '',
    contactMobile: '',
    channel: 'DoorToDoor',
    stance: 'Unknown',
    notes: '',
    followUpRequired: false,
    isKeyVoter: false,
  });

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.contactName.trim().length >= 2 || form.contactMobile.trim().length >= 10;

  const submit = async () => {
    setSaving(true);
    try {
      await createVoterOutreach({
        contactName: form.contactName || undefined,
        contactMobile: form.contactMobile || undefined,
        channel: form.channel,
        stance: form.stance,
        notes: form.notes || undefined,
        followUpRequired: form.followUpRequired,
        isKeyVoter: form.isKeyVoter,
      });
      qc.invalidateQueries({ queryKey: ['m-election-dashboard'] });
      Alert.alert('Success', 'Outreach logged');
      router.back();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const pill = (options: string[], key: 'channel' | 'stance') => (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} label={o} active={form[key] === o} onPress={() => set(key, o)} color={colors.violet} />
      ))}
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Voter Outreach" subtitle="Log voter contact" onBack={() => router.back()} />

          <Field label="Contact name" value={form.contactName} onChangeText={(v) => set('contactName', v)} />
          <Field label="Mobile" value={form.contactMobile} onChangeText={(v) => set('contactMobile', v)} keyboardType="phone-pad" />

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Channel</Text>
          {pill(CHANNELS, 'channel')}

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Stance</Text>
          {pill(STANCES, 'stance')}

          <Field label="Notes" value={form.notes} onChangeText={(v) => set('notes', v)} multiline />

          <Pressable onPress={() => set('followUpRequired', !form.followUpRequired)} className="mb-2 flex-row items-center gap-2">
            <Ionicons name={form.followUpRequired ? 'checkbox' : 'square-outline'} size={22} color={form.followUpRequired ? colors.navy : colors.faint} />
            <Text className="text-sm text-ink">Follow-up required</Text>
          </Pressable>
          <Pressable onPress={() => set('isKeyVoter', !form.isKeyVoter)} className="mb-4 flex-row items-center gap-2">
            <Ionicons name={form.isKeyVoter ? 'checkbox' : 'square-outline'} size={22} color={form.isKeyVoter ? colors.navy : colors.faint} />
            <Text className="text-sm text-ink">Key voter</Text>
          </Pressable>

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Save outreach'} icon="megaphone" onPress={valid ? submit : undefined} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
