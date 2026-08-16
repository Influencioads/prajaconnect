import * as React from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { INVITATION_CATEGORIES, createInvitation, uploadInvitationCard } from '../../lib/protocol';
import { apiError } from '../../lib/api';
import { uploadAssetError } from '../../lib/validate';
import { Screen, ScreenHeader, PrimaryButton, Card, Field, Chip, SectionTitle } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function NewInvitation() {
  const router = useRouter();
  const qc = useQueryClient();

  const [eventName, setEventName] = React.useState('');
  const [host, setHost] = React.useState('');
  const [venue, setVenue] = React.useState('');
  const [eventDate, setEventDate] = React.useState('');
  const [category, setCategory] = React.useState<string>('Other');
  const [giftNotes, setGiftNotes] = React.useState('');
  const [cardUri, setCardUri] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const captureCard = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to photograph the invitation card.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const err = uploadAssetError({
      uri: asset.uri,
      fileSize: asset.fileSize,
      // Camera captures can omit both; they are always JPEGs at this quality setting.
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? 'invitation-card.jpg',
    });
    if (err) {
      Alert.alert('Can’t use this photo', err);
      return;
    }
    setCardUri(asset.uri);
  };

  // Typed as YYYY-MM-DD so the field works without a native date picker dependency.
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? new Date(`${eventDate}T10:00:00`) : null;
  const valid = eventName.trim().length > 1 && host.trim().length > 1 && parsedDate !== null;

  const save = async () => {
    if (!valid || !parsedDate) {
      Alert.alert('Missing info', 'Event name, host and a date (YYYY-MM-DD) are required.');
      return;
    }
    setSaving(true);
    try {
      let cardPhotoUrl: string | undefined;
      if (cardUri) {
        // Upload failures must not lose the invitation — log it and save without the card.
        try {
          cardPhotoUrl = (await uploadInvitationCard(cardUri)).url;
        } catch (e) {
          console.warn('Invitation card upload failed, saving without photo:', apiError(e));
        }
      }
      await createInvitation({
        eventName: eventName.trim(),
        host: host.trim(),
        eventDate: parsedDate.toISOString(),
        venue: venue.trim() || undefined,
        category,
        cardPhotoUrl,
        giftNotes: giftNotes.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['m-invitations-pending'] });
      qc.invalidateQueries({ queryKey: ['m-invitations-decided'] });
      Alert.alert(
        'Saved',
        cardUri && !cardPhotoUrl ? 'Invitation logged (card photo upload failed).' : 'Invitation logged.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('Could not save', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="New Invitation" subtitle="Photograph the card & log it" onBack={() => router.back()} />

        <Card className="mb-4">
          <PrimaryButton label="Photograph invitation card" onPress={captureCard} variant="outline" icon="camera" />
          {cardUri ? (
            <Image source={{ uri: cardUri }} className="mt-4 h-48 w-full rounded-xl" resizeMode="cover" />
          ) : (
            <View className="mt-4 items-center">
              <Ionicons name="image-outline" size={22} color={colors.faint} />
              <Text className="mt-1 text-sm text-faint">No card photo yet</Text>
            </View>
          )}
        </Card>

        <Field label="Event name" value={eventName} onChangeText={setEventName} autoCapitalize="words" icon="calendar" />
        <Field label="Host" value={host} onChangeText={setHost} autoCapitalize="words" icon="person" />
        <Field
          label="Event date (YYYY-MM-DD)"
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="2026-09-14"
          keyboardType="numeric"
          icon="today"
        />
        <Field label="Venue" value={venue} onChangeText={setVenue} autoCapitalize="words" icon="location" />
        <Field label="Gift notes" value={giftNotes} onChangeText={setGiftNotes} autoCapitalize="sentences" icon="gift" />

        <SectionTitle>Category</SectionTitle>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {INVITATION_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <PrimaryButton
          label={saving ? 'Saving…' : 'Log invitation'}
          onPress={valid ? save : undefined}
          disabled={!valid}
          loading={saving}
          icon="save"
        />
        <View className="h-6" />
      </ScrollView>
    </Screen>
  );
}
