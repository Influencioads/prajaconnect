import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Screen, ScreenHeader, Card, PrimaryButton, Field } from '../../components/ui';
import { newDraft, saveDraft } from '../../lib/d2d-draft';

export default function D2DStart() {
  const router = useRouter();
  const { surveyId, surveyName } = useLocalSearchParams<{ surveyId: string; surveyName: string }>();
  const [street, setStreet] = React.useState('');
  const [booth, setBooth] = React.useState('');
  const [village, setVillage] = React.useState('');

  const start = async () => {
    const draft = newDraft(surveyId, surveyName);
    draft.street = street;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        draft.latitude = loc.coords.latitude;
        draft.longitude = loc.coords.longitude;
      }
    } catch {
      /* offline GPS optional */
    }
    await saveDraft(draft);
    router.push('/d2d/household');
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Start Survey" subtitle={surveyName} onBack={() => router.back()} />
        <Card className="gap-4">
          <Field label="Village" value={village} onChangeText={setVillage} placeholder="Select / enter village" />
          <Field label="Booth" value={booth} onChangeText={setBooth} placeholder="Booth number" />
          <Field label="Street / Ward" value={street} onChangeText={setStreet} placeholder="Ward 1, Main Street" />
          <PrimaryButton label="Start Household Survey" onPress={start} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
