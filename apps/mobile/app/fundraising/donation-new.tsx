import * as React from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDonation,
  createDonor,
  fetchFundraisingEvents,
  formatCurrency,
} from '../../lib/fundraising';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip, Card, Avatar, SectionTitle } from '../../components/ui';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank', 'Cheque', 'Other'];

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
            <Card className="mb-4">
              <View className="flex-row items-center">
                <Avatar name={params.donorName ?? 'Donor'} size={44} />
                <View className="ml-3">
                  <Text className="text-xs text-muted">Donor</Text>
                  <Text className="text-lg font-bold text-ink">{params.donorName}</Text>
                </View>
              </View>
            </Card>
          ) : (
            <>
              <Field label="Donor name *" value={form.donorName} onChangeText={(v) => set('donorName', v)} placeholder="Full name" icon="person" />
              <Field label="Mobile" value={form.donorMobile} onChangeText={(v) => set('donorMobile', v)} keyboardType="phone-pad" icon="call" />
            </>
          )}

          <Field label="Amount (₹) *" value={form.amount} onChangeText={(v) => set('amount', v)} keyboardType="numeric" icon="cash" />
          <Field label="Notes" value={form.notes} onChangeText={(v) => set('notes', v)} multiline icon="document-text" />

          <SectionTitle className="mt-0">Payment mode</SectionTitle>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {PAYMENT_MODES.map((o) => (
              <Chip key={o} label={o} active={form.paymentMode === o} onPress={() => set('paymentMode', o)} />
            ))}
          </View>

          {(events?.data ?? []).length > 0 && (
            <>
              <SectionTitle>Event (optional)</SectionTitle>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {(events?.data ?? []).map((e) => (
                  <Chip
                    key={e.id}
                    label={e.name}
                    active={form.eventId === e.id}
                    onPress={() => set('eventId', form.eventId === e.id ? '' : e.id)}
                  />
                ))}
              </View>
            </>
          )}

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Record donation'} icon="cash" onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? <Text className="mt-2 text-center text-xs text-faint">Donor and amount are required.</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
