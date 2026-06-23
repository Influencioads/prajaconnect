import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { D2DSentiment as D2DSentimentEnum, D2DPriority as D2DPriorityEnum, D2D_SENTIMENT_LABELS } from '@praja/types';
import { Screen, ScreenHeader, Card, PrimaryButton } from '../../components/ui';
import { loadDraft, saveDraft } from '../../lib/d2d-draft';
import { colors } from '../../lib/theme';

const SENTIMENTS = Object.values(D2DSentimentEnum);
const PRIORITIES = Object.values(D2DPriorityEnum);

export default function D2DSentimentScreen() {
  const router = useRouter();
  const [sentiment, setSentiment] = React.useState<D2DSentimentEnum | undefined>();
  const [priority, setPriority] = React.useState<D2DPriorityEnum>(D2DPriorityEnum.Medium);
  const [needsFollowup, setNeedsFollowup] = React.useState(false);
  const [isKeyVoter, setIsKeyVoter] = React.useState(false);
  const [influencer, setInfluencer] = React.useState(false);

  const save = async (patch: object) => {
    const d = await loadDraft();
    if (d) await saveDraft({ ...d, ...patch });
  };

  const next = async () => {
    await save({ sentiment, priority, needsFollowup, isKeyVoter, influencer });
    router.push('/d2d/issues');
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Political Sentiment" subtitle="Record voter preference" onBack={() => router.back()} />

        <Card className="mb-4">
          <Text className="mb-3 font-semibold text-navy">Sentiment</Text>
          <View className="gap-2">
            {SENTIMENTS.map((s) => (
              <Pressable
                key={s}
                onPress={() => { setSentiment(s); save({ sentiment: s }); }}
                className="rounded-xl px-4 py-4"
                style={{ backgroundColor: sentiment === s ? colors.gold : '#f3f4f6' }}
              >
                <Text className="text-center font-bold text-navy">{D2D_SENTIMENT_LABELS[s]}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card className="mb-4 gap-3">
          <Text className="font-semibold text-navy">Priority</Text>
          <View className="flex-row gap-2">
            {PRIORITIES.map((p) => (
              <Pressable key={p} onPress={() => { setPriority(p); save({ priority: p }); }} className="flex-1 rounded-xl py-3" style={{ backgroundColor: priority === p ? colors.navy : '#f3f4f6' }}>
                <Text className="text-center font-semibold" style={{ color: priority === p ? '#fff' : colors.navy }}>{p}</Text>
              </Pressable>
            ))}
          </View>
          {[
            { label: 'Needs Follow-up', value: needsFollowup, set: setNeedsFollowup, key: 'needsFollowup' },
            { label: 'Key Voter', value: isKeyVoter, set: setIsKeyVoter, key: 'isKeyVoter' },
            { label: 'Influencer in Family', value: influencer, set: setInfluencer, key: 'influencer' },
          ].map((t) => (
            <Pressable
              key={t.key}
              onPress={() => { t.set(!t.value); save({ [t.key]: !t.value }); }}
              className="flex-row items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <Text className="text-navy">{t.label}</Text>
              <Text className="font-bold text-navy">{t.value ? 'Yes' : 'No'}</Text>
            </Pressable>
          ))}
        </Card>

        <PrimaryButton label="Citizen Issues" onPress={next} />
      </ScrollView>
    </Screen>
  );
}
