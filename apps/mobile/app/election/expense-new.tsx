import * as React from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createElectionExpense, fetchExpenseCategories } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip } from '../../components/ui';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank', 'Cheque', 'Other'];

function Pills({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} label={o.label} active={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

export default function ExpenseNew() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    categoryId: '',
    amount: '',
    vendorName: '',
    paidBy: '',
    paymentMode: 'Cash',
    notes: '',
    receiptUrl: '',
  });

  const { data: categories } = useQuery({ queryKey: ['m-election-expense-categories'], queryFn: fetchExpenseCategories });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim().length >= 2 && form.categoryId && Number(form.amount) > 0;

  const submit = async () => {
    setSaving(true);
    try {
      await createElectionExpense({
        title: form.title,
        categoryId: form.categoryId,
        amount: Number(form.amount),
        vendorName: form.vendorName || undefined,
        paidBy: form.paidBy || undefined,
        paymentMode: form.paymentMode,
        notes: form.notes || undefined,
        receiptUrl: form.receiptUrl || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-election-dashboard'] });
      qc.invalidateQueries({ queryKey: ['m-election-expenses'] });
      Alert.alert('Success', 'Expense logged');
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
          <ScreenHeader title="Add Expense" subtitle="Log campaign spending" onBack={() => router.back()} />

          <Field label="Title *" value={form.title} onChangeText={(v) => set('title', v)} placeholder="Rally banners, fuel…" />
          <Field label="Amount (₹) *" value={form.amount} onChangeText={(v) => set('amount', v)} keyboardType="numeric" />
          <Field label="Vendor" value={form.vendorName} onChangeText={(v) => set('vendorName', v)} />
          <Field label="Paid by" value={form.paidBy} onChangeText={(v) => set('paidBy', v)} />
          <Field label="Receipt URL" value={form.receiptUrl} onChangeText={(v) => set('receiptUrl', v)} placeholder="From upload screen" />
          <Field label="Notes" value={form.notes} onChangeText={(v) => set('notes', v)} multiline />

          {categories?.length ? (
            <>
              <Text className="mb-1.5 text-[13px] font-semibold text-ink">Category *</Text>
              <Pills
                options={categories.map((c) => ({ label: c.label, value: c.id }))}
                value={form.categoryId}
                onChange={(v) => set('categoryId', v)}
              />
            </>
          ) : null}

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Payment mode</Text>
          <Pills options={PAYMENT_MODES.map((p) => ({ label: p, value: p }))} value={form.paymentMode} onChange={(v) => set('paymentMode', v)} />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Save expense'} icon="cash" onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? <Text className="mt-2 text-center text-xs text-faint">Title, category and amount are required.</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
