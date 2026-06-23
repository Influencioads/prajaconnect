import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { addVehicleTrip, fetchElectionVehicles, fetchVehicleTrips } from '../../lib/elections';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function TripEnd() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicleId?: string; tripId?: string }>();
  const [saving, setSaving] = React.useState(false);
  const [vehicleId, setVehicleId] = React.useState(params.vehicleId ?? '');
  const [startKm, setStartKm] = React.useState('');
  const [endKm, setEndKm] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const { data: vehicles } = useQuery({ queryKey: ['m-election-vehicles'], queryFn: () => fetchElectionVehicles() });
  const { data: trips } = useQuery({
    queryKey: ['m-election-trips', vehicleId],
    queryFn: () => fetchVehicleTrips(vehicleId),
    enabled: !!vehicleId,
  });

  React.useEffect(() => {
    if (!trips?.data?.length) return;
    const open = params.tripId
      ? trips.data.find((t) => t.id === params.tripId)
      : trips.data.find((t) => t.endKm == null);
    if (open && !startKm) setStartKm(String(open.startKm));
  }, [trips, params.tripId, startKm]);

  const valid = !!vehicleId && Number(startKm) >= 0 && Number(endKm) > Number(startKm);

  const submit = async () => {
    setSaving(true);
    try {
      await addVehicleTrip(vehicleId, {
        startKm: Number(startKm),
        endKm: Number(endKm),
        notes: notes || undefined,
      });
      Alert.alert('Success', 'Trip ended');
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
          <ScreenHeader title="End Trip" subtitle="Log odometer at trip end" onBack={() => router.back()} />

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
          <Field label="Start KM *" value={startKm} onChangeText={setStartKm} keyboardType="numeric" />
          <Field label="End KM *" value={endKm} onChangeText={setEndKm} keyboardType="numeric" />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          <View className="mb-10 mt-2">
            <PrimaryButton label={saving ? 'Saving…' : 'End trip'} onPress={valid ? submit : undefined} loading={saving} />
            {!valid ? <Text className="mt-2 text-center text-xs text-gray-400">End KM must be greater than start KM.</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
