import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Screen, ScreenHeader, Card, PrimaryButton } from '../../components/ui';
import { clearDraft, loadDraft } from '../../lib/d2d-draft';
import { saveLocalResponse } from '../../lib/db';
import { submitD2DResponse } from '../../lib/d2d';
import { flushSyncQueue } from '../../lib/sync';

export default function D2DSubmit() {
  const router = useRouter();
  const [draft, setDraft] = React.useState<Awaited<ReturnType<typeof loadDraft>>>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    loadDraft().then(setDraft);
  }, []);

  const submit = async () => {
    if (!draft) return;
    setSubmitting(true);
    const clientId = `resp-${Date.now()}`;
    const timeTakenSec = draft.startedAt ? Math.round((Date.now() - draft.startedAt) / 1000) : undefined;

    const payload = {
      surveyId: draft.surveyId,
      clientId,
      household: {
        clientId: `hh-${clientId}`,
        houseNumber: draft.houseNumber,
        headName: draft.headName ?? 'Unknown',
        mobile: draft.mobile,
        whatsapp: draft.whatsapp,
        address: draft.address,
        ward: draft.ward,
        street: draft.street,
        latitude: draft.latitude,
        longitude: draft.longitude,
        members: draft.members.map((m) => ({
          name: m.name,
          age: m.age ? Number(m.age) : undefined,
          voterId: m.voterId,
          mobile: m.mobile,
        })),
      },
      sentiment: draft.sentiment,
      priority: draft.priority,
      needsFollowup: draft.needsFollowup,
      isKeyVoter: draft.isKeyVoter,
      influencer: draft.influencer,
      issues: draft.issues,
      timeTakenSec,
      latitude: draft.latitude,
      longitude: draft.longitude,
      answers: Object.entries(draft.answers).map(([questionId, value]) => ({ questionId, value })),
      photos: draft.photos.map((p) => ({ url: p.uri, label: p.label })),
    };

    await saveLocalResponse(clientId, draft.surveyId, `hh-${clientId}`, payload);

    const net = await NetInfo.fetch();
    if (net.isConnected) {
      try {
        await submitD2DResponse(payload);
        await flushSyncQueue();
        setMessage('Survey synced to server successfully.');
      } catch {
        setMessage('Saved locally. Will sync when online.');
      }
    } else {
      setMessage('Saved offline. Will sync when internet returns.');
    }

    await clearDraft();
    setSubmitting(false);
  };

  if (!draft) {
    return (
      <Screen>
        <ScreenHeader title="Submit Survey" onBack={() => router.back()} />
        <Card><Text className="text-gray-500">No draft found.</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Submit Survey" subtitle={draft.surveyName} onBack={() => router.back()} />

        <Card className="mb-4 gap-2">
          <Text className="font-bold text-navy">{draft.headName}</Text>
          <Text className="text-sm text-gray-500">House #{draft.houseNumber} · {draft.members.length} members</Text>
          <Text className="text-sm text-gray-500">Sentiment: {draft.sentiment ?? '—'}</Text>
          <Text className="text-sm text-gray-500">Issues: {draft.issues.join(', ') || 'None'}</Text>
        </Card>

        {message ? <Card className="mb-4"><Text className="text-navy">{message}</Text></Card> : null}

        <PrimaryButton label={submitting ? 'Saving…' : 'Save & Mark House Complete'} onPress={submit} loading={submitting} />

        <View className="mt-3">
          <PrimaryButton label="Back to D2D Home" onPress={() => router.replace('/d2d')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
