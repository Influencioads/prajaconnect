import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Screen, ScreenHeader, Card, PrimaryButton, Field } from '../../components/ui';
import { fetchMyD2DAssignments } from '../../lib/d2d';
import { loadDraft, saveDraft } from '../../lib/d2d-draft';
import { colors } from '../../lib/theme';

export default function D2DQuestions() {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [surveyId, setSurveyId] = React.useState('');

  const { data } = useQuery({ queryKey: ['m-d2d-assignments'], queryFn: fetchMyD2DAssignments });

  React.useEffect(() => {
    loadDraft().then((d) => {
      if (!d) return;
      setSurveyId(d.surveyId);
      setAnswers(d.answers);
    });
  }, []);

  const survey = data?.assignments.find((a) => a.survey.id === surveyId)?.survey;
  const questions = survey?.questions ?? [];

  const setAnswer = async (qid: string, value: unknown) => {
    const next = { ...answers, [qid]: value };
    setAnswers(next);
    const d = await loadDraft();
    if (d) await saveDraft({ ...d, answers: next });
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) {
      const d = await loadDraft();
      if (d) {
        d.photos = [...d.photos, { uri: result.assets[0].uri, label: 'Survey photo' }];
        await saveDraft(d);
      }
    }
  };

  const next = () => router.push('/d2d/sentiment');

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Survey Questions" subtitle="Telugu + English" onBack={() => router.back()} />

        {questions.map((q) => (
          <Card key={q.id} className="mb-3">
            <Text className="font-semibold text-navy">{q.label}</Text>
            {q.labelTe ? <Text className="text-sm text-gray-500">{q.labelTe}</Text> : null}

            {q.type === 'YesNo' ? (
              <View className="mt-3 flex-row gap-2">
                {['Yes', 'No'].map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => setAnswer(q.id, opt === 'Yes')}
                    className="flex-1 items-center rounded-xl py-3"
                    style={{ backgroundColor: answers[q.id] === (opt === 'Yes') ? colors.navy : '#f3f4f6' }}
                  >
                    <Text style={{ color: answers[q.id] === (opt === 'Yes') ? '#fff' : colors.navy, fontWeight: '700' }}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            ) : q.type === 'Rating' ? (
              <View className="mt-3 flex-row gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setAnswer(q.id, n)} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: answers[q.id] === n ? colors.gold : '#f3f4f6' }}>
                    <Text className="font-bold text-navy">{n}</Text>
                  </Pressable>
                ))}
              </View>
            ) : q.options?.length ? (
              <View className="mt-3 gap-2">
                {q.options.map((o) => (
                  <Pressable key={o.value} onPress={() => setAnswer(q.id, o.value)} className="rounded-xl border border-gray-200 px-4 py-3" style={{ borderColor: answers[q.id] === o.value ? colors.navy : '#e5e7eb' }}>
                    <Text className="text-navy">{o.label}</Text>
                    {o.labelTe ? <Text className="text-xs text-gray-500">{o.labelTe}</Text> : null}
                  </Pressable>
                ))}
              </View>
            ) : (
              <Field
                label="Answer"
                value={String(answers[q.id] ?? '')}
                onChangeText={(v) => setAnswer(q.id, v)}
                placeholder="Your answer"
              />
            )}
          </Card>
        ))}

        <Pressable onPress={pickPhoto} className="mb-4 h-12 items-center justify-center rounded-xl border border-dashed border-navy">
          <Text className="font-semibold text-navy">Upload Photo</Text>
        </Pressable>

        <PrimaryButton label="Political Sentiment" onPress={next} />
      </ScrollView>
    </Screen>
  );
}
