import * as React from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { addVehicleTrip, fetchElectionVehicles } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Chip } from '../../components/ui';

export default function TripStart() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [vehicleId, setVehicleId] = React.useState('');
  const [startKm, setStartKm] = React.useState('');
  const [route, setRoute] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const { data: vehicles } = useQuery({ queryKey: ['m-election-vehicles'], queryFn: () => fetchElectionVehicles() });
  const valid = !!vehicleId && Number(startKm) >= 0;

  const submit = async () => {
    setSaving(true);
    try {
      await addVehicleTrip(vehicleId, {
        startKm: Number(startKm),
        route: route || undefined,
        notes: notes || undefined,
      });
      Alert.alert('Success', 'Trip started');
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
          <ScreenHeader title="Start Trip" subtitle="Log odometer at trip start" onBack={() => router.back()} />

          {vehicles?.data?.length ? (
            <>
              <Text className="mb-1.5 text-[13px] font-semibold text-ink">Vehicle *</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {vehicles.data.map((v) => (
                  <Chip key={v.id} label={v.vehicleNumber} active={vehicleId === v.id} onPress={() => setVehicleId(v.id)} />
                ))}
              </View>
            </>
          ) : (
            <Text className="mb-3 text-sm text-muted">No vehicles found. Enter vehicle ID below.</Text>
          )}

          <Field label="Vehicle ID" value={vehicleId} onChangeText={setVehicleId} placeholder="If not listed above" />
          <Field label="Start KM *" value={startKm} onChangeText={setStartKm} keyboardType="numeric" />
          <Field label="Route" value={route} onChangeText={setRoute} placeholder="Mandal → Village" />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'Start trip'} icon="trail-sign" onPress={valid ? submit : undefined} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
