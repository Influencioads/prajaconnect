import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { distributeMaterial, fetchElectionMaterials } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function MaterialReceived() {
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [materialId, setMaterialId] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const { data: materials } = useQuery({ queryKey: ['m-election-materials'], queryFn: () => fetchElectionMaterials() });
  const valid = !!materialId && Number(quantity) > 0;

  const submit = async () => {
    setSaving(true);
    try {
      await distributeMaterial(materialId, {
        quantity: Number(quantity),
        notes: notes || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-election-materials'] });
      Alert.alert('Success', 'Material receipt confirmed');
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
          <ScreenHeader title="Material Received" subtitle="Confirm material distribution" onBack={() => router.back()} />

          {materials?.data?.length ? (
            <>
              <Text className="mb-1 text-sm font-medium text-gray-700">Material *</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {materials.data.map((m) => {
                  const active = materialId === m.id;
                  const stock = m.stockRemaining ?? m.stockTotal;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMaterialId(m.id)}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>
                        {m.name} ({stock})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <Text className="mb-3 text-sm text-gray-500">No materials in stock.</Text>
          )}

          <Field label="Material ID" value={materialId} onChangeText={setMaterialId} />
          <Field label="Quantity received *" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Booth, mandal, condition…" />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Confirm receipt'} onPress={valid ? submit : undefined} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
