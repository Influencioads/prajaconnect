import * as React from 'react';
import { View, Text, ScrollView, Image, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetchProjectsForUpdate, submitWorkProgress, type ProjectPick } from '../../lib/funds';
import { apiError } from '../../lib/api';
import { Screen, ScreenHeader, Field, PrimaryButton, Card, Chip, SearchBar, EmptyState } from '../../components/ui';
import { colors } from '../../lib/theme';

// ponytail: no slider dep in the app — fixed percent chips instead of a slider
const PERCENTS = [10, 25, 50, 75, 90, 100];

export default function FundsWorkUpdate() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [project, setProject] = React.useState<ProjectPick | null>(null);
  const [milestone, setMilestone] = React.useState('');
  const [percent, setPercent] = React.useState(25);
  const [notes, setNotes] = React.useState('');
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Auto-capture GPS on mount (same pattern as attendance check-in).
  React.useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(async ({ status }) => {
        if (status !== 'granted') return;
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch {
          /* GPS optional */
        }
      })
      .catch(() => undefined);
  }, []);

  const { data: projects } = useQuery({
    queryKey: ['m-funds-projects', search],
    queryFn: () => fetchProjectsForUpdate(search || undefined),
  });

  const capture = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to attach a site photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach a site photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const submit = async () => {
    if (!project) {
      Alert.alert('Pick a project', 'Select the work/project you are updating.');
      return;
    }
    if (milestone.trim().length < 2) {
      Alert.alert('Milestone required', 'Describe the milestone, e.g. "Foundation complete".');
      return;
    }
    setSaving(true);
    try {
      await submitWorkProgress(project.id, {
        milestone: milestone.trim(),
        percentComplete: percent,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        notes: notes.trim() || undefined,
        photo: photo ? { uri: photo } : null,
      });
      Alert.alert('Submitted', 'Progress update recorded.');
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
          <ScreenHeader
            title="Work Progress Update"
            subtitle="Milestone, photo & GPS from the field"
            onBack={() => router.back()}
          />

          {project ? (
            <Card className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-bold text-ink">{project.name}</Text>
                <Text className="mt-0.5 text-xs text-muted">
                  {project.mandal?.name ?? '—'} · {project.progressPct}% so far
                </Text>
              </View>
              <Pressable onPress={() => setProject(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.faint} />
              </Pressable>
            </Card>
          ) : (
            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-semibold text-ink">Project / work</Text>
              <SearchBar value={search} onChangeText={setSearch} placeholder="Search projects…" />
              {projects?.length ? (
                projects.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setProject(p)}
                    className="mb-2 rounded-2xl border border-line bg-white px-4 py-3 active:opacity-80"
                  >
                    <Text className="font-semibold text-ink">{p.name}</Text>
                    <Text className="mt-0.5 text-xs text-muted">
                      {p.mandal?.name ?? '—'} · {p.status} · {p.progressPct}%
                    </Text>
                  </Pressable>
                ))
              ) : (
                <EmptyState title="No projects found" subtitle="Try a different search." icon="search" />
              )}
            </View>
          )}

          <Field
            label="Milestone"
            value={milestone}
            onChangeText={setMilestone}
            placeholder="e.g. Foundation complete"
            autoCapitalize="sentences"
          />

          <Text className="mb-1.5 text-[13px] font-semibold text-ink">Percent complete: {percent}%</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {PERCENTS.map((p) => (
              <Chip key={p} label={`${p}%`} active={percent === p} onPress={() => setPercent(p)} />
            ))}
          </View>

          <Field
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Site observations, issues…"
            autoCapitalize="sentences"
          />

          <Card className="mb-4">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <PrimaryButton label="Camera" icon="camera" variant="outline" onPress={capture} />
              </View>
              <View className="flex-1">
                <PrimaryButton label="Gallery" icon="image" variant="outline" onPress={pickFromLibrary} />
              </View>
            </View>
            {photo ? (
              <Image source={{ uri: photo }} className="mt-3 h-48 w-full rounded-xl" resizeMode="cover" />
            ) : (
              <Text className="mt-3 text-center text-xs text-faint">Attach a geotagged site photo.</Text>
            )}
          </Card>

          <Text className="mb-3 text-xs text-muted">
            {coords
              ? `GPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
              : 'GPS: acquiring… (submitted without location if unavailable)'}
          </Text>

          <View className="mb-10">
            <PrimaryButton
              label={saving ? 'Submitting…' : 'Submit progress update'}
              icon="checkmark-circle"
              onPress={submit}
              loading={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
