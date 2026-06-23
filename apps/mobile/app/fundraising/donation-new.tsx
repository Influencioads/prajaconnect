import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDonation,
  createDonor,
  fetchFundraisingEvents,
  formatCurrency,
} from '../../lib/fundraising';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank', 'Cheque', 'Other'];

function Pills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable key={o} onPress={() => onChange(o)} className="rounded-full px-3 py-1.5" style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}>
            <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function DonationNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ donorId?: string; donorName?: string }>();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    donorName: params.donorName ?? '',
    donorMobile: '',
    amount: '',
    paymentMode: 'Cash',
    eventId: '',
    notes: '',
  });

  const { data: events } = useQuery({ queryKey: ['m-fundraising-events'], queryFn: fetchFundraisingEvents });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = (params.donorId || form.donorName.trim().length >= 2) && Number(form.amount) > 0;

  const submit = async () => {
    setSaving(true);
    try {
      let donorId = params.donorId;
      if (!donorId) {
        const donor = await createDonor({
          name: form.donorName.trim(),
          mobile: form.donorMobile || undefined,
        });
        donorId = donor.id;
      }
      await createDonation({
        donorId,
        amount: Number(form.amount),
        paymentMode: form.paymentMode,
        eventId: form.eventId || undefined,
        notes: form.notes || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-fundraising-donors'] });
      Alert.alert('Success', `Donation of ${formatCurrency(Number(form.amount))} recorded`);
      router.back();
    } catch (e) {
      Alert.alert('Failed', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Quick Donation" subtitle="Capture field donation" onBack={() => router.back()} />

          {params.donorId ? (
            <View className="mb-4 rounded-xl bg-slate-100 px-4 py-3">
              <Text className="text-sm text-slate-500">Donor</Text>
              <Text className="text-lg font-bold" style={{ color: colors.navy }}>{params.donorName}</Text>
            </View>
          ) : (
            <>
              <Field label="Donor name *" value={form.donorName} onChangeText={(v) => set('donorName', v)} placeholder="Full name" />
              <Field label="Mobile" value={form.donorMobile} onChangeText={(v) => set('donorMobile', v)} keyboardType="phone-pad" />
            </>
          )}

          <Field label="Amount (₹) *" value={form.amount} onChangeText={(v) => set('amount', v)} keyboardType="numeric" />
          <Field label="Notes" value={form.notes} onChangeText={(v) => set('notes', v)} multiline />

          <Text className="mb-1 text-sm font-medium text-gray-700">Payment mode</Text>
          <Pills options={PAYMENT_MODES} value={form.paymentMode} onChange={(v) => set('paymentMode', v)} />

          {(events?.data ?? []).length > 0 && (
            <>
              <Text className="mb-1 text-sm font-medium text-gray-700">Event (optional)</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {(events?.data ?? []).map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => set('eventId', form.eventId === e.id ? '' : e.id)}
                    className="rounded-full px-3 py-1.5"
                    style={{ backgroundColor: form.eventId === e.id ? colors.navy : '#E2E8F0' }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: form.eventId === e.id ? '#fff' : colors.muted }}>{e.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Record donation'} onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? <Text className="mt-2 text-center text-xs text-gray-400">Donor and amount are required.</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
