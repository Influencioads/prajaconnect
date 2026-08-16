import * as React from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { fetchGeoOptions } from '../../lib/crm';
import {
  OPPOSITION_ACTIVITY_TYPES,
  createOppositionActivity,
  uploadGroundIntelPhoto,
} from '../../lib/ground-intel';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Card } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function OppositionLog() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [rivalName, setRivalName] = React.useState('');
  const [party, setParty] = React.useState('');
  const [activityType, setActivityType] = React.useState<string>('Meeting');
  const [description, setDescription] = React.useState('');
  const [headcount, setHeadcount] = React.useState('');
  const [villageId, setVillageId] = React.useState<string | null>(null);
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);

  const { data: geo } = useQuery({ queryKey: ['m-geo-options'], queryFn: fetchGeoOptions });
  const villages = (geo?.villages ?? []).filter((v) => !user?.mandalId || v.mandalId === user.mandalId);

  // GPS-light: one best-effort fix on mount, stamped into the report text.
  // The model has no lat/lng column, so we do not block the form on it.
  React.useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(async ({ status }) => {
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      })
      .catch(() => undefined);
  }, []);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!rivalName.trim()) throw new Error('Rival name is required');
      if (!description.trim()) throw new Error('Description is required');

      let photoUrl: string | undefined;
      if (photoUri) {
        try {
          photoUrl = (await uploadGroundIntelPhoto(photoUri)).url;
        } catch (e) {
          // A failed upload must not cost us the report — log it without the photo.
          console.warn('Ground intel photo upload failed, submitting without it:', apiError(e));
        }
      }

      const gpsNote = coords
        ? `\nGPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
        : '';

      return createOppositionActivity({
        rivalName: rivalName.trim(),
        party: party.trim() || undefined,
        activityType,
        description: `${description.trim()}${gpsNote}`,
        headcount: headcount ? Number(headcount) : undefined,
        villageId: villageId ?? undefined,
        mandalId: user?.mandalId ?? undefined,
        photoUrl,
        occurredAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['m-gi-feed'] });
      Alert.alert('Logged', 'Opposition activity reported');
      router.back();
    },
    onError: (e: Error) => Alert.alert('Could not log', apiError(e) || e.message),
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Log Opposition" subtitle="Rival activity seen in the field" onBack={() => router.back()} />

        <Field label="Rival name *" value={rivalName} onChangeText={setRivalName} autoCapitalize="words" />
        <Field label="Party" value={party} onChangeText={setParty} autoCapitalize="words" />

        <Text className="mb-1 text-sm font-medium text-gray-700">Activity type</Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {OPPOSITION_ACTIVITY_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setActivityType(t)}
              className="rounded-full border px-3 py-1.5"
              style={{
                borderColor: activityType === t ? colors.navy : colors.border,
                backgroundColor: activityType === t ? `${colors.navy}15` : colors.white,
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: activityType === t ? colors.navy : colors.muted }}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="mb-1 text-sm font-medium text-gray-700">Village</Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {villages.slice(0, 40).map((v) => (
            <Pressable
              key={v.id}
              onPress={() => setVillageId(villageId === v.id ? null : v.id)}
              className="rounded-full border px-3 py-1.5"
              style={{
                borderColor: villageId === v.id ? colors.navy : colors.border,
                backgroundColor: villageId === v.id ? `${colors.navy}15` : colors.white,
              }}
            >
              <Text className="text-xs" style={{ color: villageId === v.id ? colors.navy : colors.muted }}>
                {v.name}
              </Text>
            </Pressable>
          ))}
          {!villages.length && <Text className="text-xs text-gray-400">No villages available</Text>}
        </View>

        <Field label="What happened? *" value={description} onChangeText={setDescription} multiline autoCapitalize="sentences" />
        <Field label="Crowd size (approx)" value={headcount} onChangeText={setHeadcount} keyboardType="numeric" />

        <Card className="mb-4">
          <PrimaryButton label={photoUri ? 'Change photo' : 'Attach photo'} onPress={pickPhoto} />
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="mt-3 h-40 w-full rounded-xl" resizeMode="cover" />
          ) : (
            <Text className="mt-3 text-center text-xs text-gray-400">Optional evidence photo</Text>
          )}
          <Text className="mt-3 text-center text-xs text-gray-400">
            {coords
              ? `GPS ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
              : 'GPS unavailable — report will be saved without coordinates'}
          </Text>
        </Card>

        <PrimaryButton
          label={submit.isPending ? 'Submitting…' : 'Submit report'}
          loading={submit.isPending}
          onPress={() => submit.mutate()}
        />
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
