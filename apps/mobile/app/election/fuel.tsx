import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { addVehicleFuel, fetchElectionVehicles } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function FuelEntry() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [vehicleId, setVehicleId] = React.useState('');
  const [cost, setCost] = React.useState('');
  const [liters, setLiters] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [createExpense, setCreateExpense] = React.useState(true);

  const { data: vehicles } = useQuery({ queryKey: ['m-election-vehicles'], queryFn: () => fetchElectionVehicles() });
  const valid = !!vehicleId && Number(cost) > 0;

  const submit = async () => {
    setSaving(true);
    try {
      await addVehicleFuel(vehicleId, {
        cost: Number(cost),
        liters: liters ? Number(liters) : undefined,
        notes: notes || undefined,
        createExpense,
      });
      Alert.alert('Success', 'Fuel entry logged');
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
          <ScreenHeader title="Fuel Entry" subtitle="Record fuel purchase" onBack={() => router.back()} />

          {vehicles?.data?.length ? (
            <>
              <Text className="mb-1 text-sm font-medium text-gray-700">Vehicle *</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {vehicles.data.map((v) => {
                  const active = vehicleId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => setVehicleId(v.id)}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: active ? colors.navy : '#E2E8F0' }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.muted }}>
                        {v.vehicleNumber}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Field label="Vehicle ID" value={vehicleId} onChangeText={setVehicleId} />
          <Field label="Cost (₹) *" value={cost} onChangeText={setCost} keyboardType="numeric" />
          <Field label="Liters" value={liters} onChangeText={setLiters} keyboardType="numeric" />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          <Pressable onPress={() => setCreateExpense((v) => !v)} className="mb-4 flex-row items-center gap-2">
            <View className="h-5 w-5 rounded border border-gray-300" style={{ backgroundColor: createExpense ? colors.navy : '#fff' }} />
            <Text className="text-sm text-gray-700">Also create expense entry</Text>
          </Pressable>

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Save fuel entry'} onPress={valid ? submit : undefined} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
