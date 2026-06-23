import * as React from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { checkEligibility, type EligibilityResult } from '../lib/crm';
import { apiError } from '../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Card, Badge, EmptyState } from '../components/ui';
import { colors } from '../lib/theme';

export default function Eligibility() {
  const router = useRouter();
  const [form, setForm] = React.useState({ age: '', income: '', occupation: '' });
  const [hasSchoolChild, setHasSchoolChild] = React.useState(false);
  const [ownsHouse, setOwnsHouse] = React.useState(false);
  const [results, setResults] = React.useState<EligibilityResult[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true);
    try {
      const res = await checkEligibility({
        age: form.age ? Number(form.age) : undefined,
        income: form.income ? Number(form.income) : undefined,
        occupation: form.occupation || undefined,
        hasSchoolChild,
        ownsHouse,
      });
      setResults(res);
    } catch (e) {
      setResults([]);
      console.warn(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Scheme eligibility" subtitle="Check welfare scheme matches" onBack={() => router.back()} />

          <Field label="Age" value={form.age} onChangeText={(v) => set('age', v)} keyboardType="numeric" />
          <Field label="Annual income (₹)" value={form.income} onChangeText={(v) => set('income', v)} keyboardType="numeric" />
          <Field label="Occupation" value={form.occupation} onChangeText={(v) => set('occupation', v)} placeholder="Farmer, Labour…" />

          <Pressable onPress={() => setHasSchoolChild((v) => !v)} className="mb-2 flex-row items-center">
            <View className="mr-2 h-5 w-5 rounded border" style={{ backgroundColor: hasSchoolChild ? colors.navy : '#fff', borderColor: colors.border }} />
            <Text className="text-sm text-gray-700">Has school-going child</Text>
          </Pressable>
          <Pressable onPress={() => setOwnsHouse((v) => !v)} className="mb-4 flex-row items-center">
            <View className="mr-2 h-5 w-5 rounded border" style={{ backgroundColor: ownsHouse ? colors.navy : '#fff', borderColor: colors.border }} />
            <Text className="text-sm text-gray-700">Owns a pucca house</Text>
          </Pressable>

          <PrimaryButton label={loading ? 'Checking…' : 'Check eligibility'} onPress={run} loading={loading} />

          <View className="mt-4">
            {results === null ? null : results.length === 0 ? (
              <EmptyState title="No schemes matched" subtitle="Try adjusting the details." />
            ) : (
              results.map((r) => (
                <Card key={r.schemeId} className="mb-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 pr-2 text-base font-semibold text-navy">{r.name}</Text>
                    <Badge label={r.eligible ? 'Eligible' : 'Not eligible'} color={r.eligible ? colors.success : colors.danger} />
                  </View>
                  {r.reasons.map((reason, i) => (
                    <Text key={i} className="mt-1 text-xs text-gray-500">
                      • {reason}
                    </Text>
                  ))}
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
